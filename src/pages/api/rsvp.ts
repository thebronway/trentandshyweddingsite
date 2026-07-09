import type { APIRoute } from 'astro';
import { db } from '../../db';
import { guests, settings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sendGuestConfirmation, sendAdminNotification } from '../../utils/email';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const idStr = formData.get('id')?.toString();
  
  if (!idStr) return new Response('Guest ID required', { status: 400 });
  const id = parseInt(idStr, 10);

  const existingGuest = await db.select().from(guests).where(eq(guests.id, id));
  if (existingGuest.length === 0) return new Response('Guest not found', { status: 404 });
  
  const isUpdate = existingGuest[0].hasRsvpd;

  const rawEmail = formData.get('email')?.toString().trim().toLowerCase();
  const email = rawEmail ? rawEmail : null;
  
  const rawPhone = formData.get('phoneNumber')?.toString() || null;
  const phoneNumber = rawPhone ? rawPhone.replace(/\D/g, '').replace(/^1/, '') : null;
  
  if (!email && !phoneNumber) {
      return redirect('/tickets?error=duplicate');
  }

  const isAttending = formData.get('isAttending') === 'true';
  const p1Attending = formData.get('p1Attending')?.toString() || 'pending';
  const p2Attending = formData.get('p2Attending')?.toString() || 'pending';
  const p3Attending = formData.get('p3Attending')?.toString() || 'pending';
  
  const extractPhone = (val: string | undefined) => val ? val.replace(/\D/g, '').replace(/^1/, '') : null;
  const p1Email = formData.get('p1Email')?.toString().trim().toLowerCase() || null;
  const p1PhoneNumber = extractPhone(formData.get('p1PhoneNumber')?.toString());
  const p2Email = formData.get('p2Email')?.toString().trim().toLowerCase() || null;
  const p2PhoneNumber = extractPhone(formData.get('p2PhoneNumber')?.toString());
  const p3Email = formData.get('p3Email')?.toString().trim().toLowerCase() || null;
  const p3PhoneNumber = extractPhone(formData.get('p3PhoneNumber')?.toString());

  // Strip line breaks so they don't mess up simple CSV viewers
  const sanitizeText = (str: string | undefined) => str ? str.replace(/[\r\n]+/g, ' ').trim() : null;

  try {
    await db.update(guests)
      .set({ 
        email,
        phoneNumber,
        isAttending,
        dietaryNotes: sanitizeText(formData.get('dietaryNotes')?.toString()),
        songRequest: sanitizeText(formData.get('songRequest')?.toString()),
        p1Attending, p1Email, p1PhoneNumber,
        p2Attending, p2Email, p2PhoneNumber,
        p3Attending, p3Email, p3PhoneNumber,
        hasRsvpd: true
      })
      .where(eq(guests.id, id));
  } catch (e) {
    return redirect('/tickets?error=duplicate');
  }

  // Fetch the fresh records to send in the emails
  const updatedGuestQuery = await db.select().from(guests).where(eq(guests.id, id));
  const allGuests = await db.select().from(guests);
  
  const siteSettingsQuery = await db.select().from(settings).limit(1);
  const closeDate = siteSettingsQuery.length > 0 ? siteSettingsQuery[0].rsvpCloseDate : null;

  // Send the guest email (if anyone in the party has an email), then send the admin the updated CSV
  if (updatedGuestQuery.length > 0) {
    const party = updatedGuestQuery[0];
    const hasAnyEmail = party.email || party.p1Email || party.p2Email || party.p3Email;
    
    if (hasAnyEmail) {
      await sendGuestConfirmation(party, isUpdate, closeDate);
    }
    await sendAdminNotification(party, allGuests, isUpdate ? 'Updated RSVP' : 'Initial RSVP');
  }

  return redirect('/tickets?success=true');
};