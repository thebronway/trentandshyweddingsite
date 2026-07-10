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
  let p1Email = formData.get('p1Email')?.toString().trim().toLowerCase() || null;
  let p1PhoneNumber = extractPhone(formData.get('p1PhoneNumber')?.toString());
  let p2Email = formData.get('p2Email')?.toString().trim().toLowerCase() || null;
  let p2PhoneNumber = extractPhone(formData.get('p2PhoneNumber')?.toString());
  let p3Email = formData.get('p3Email')?.toString().trim().toLowerCase() || null;
  let p3PhoneNumber = extractPhone(formData.get('p3PhoneNumber')?.toString());

  // 1. SILENTLY DEDUPLICATE INTRA-PARTY INFO
  if (p1Email === email) p1Email = null;
  if (p2Email === email || p2Email === p1Email) p2Email = null;
  if (p3Email === email || p3Email === p1Email || p3Email === p2Email) p3Email = null;

  if (p1PhoneNumber === phoneNumber) p1PhoneNumber = null;
  if (p2PhoneNumber === phoneNumber || p2PhoneNumber === p1PhoneNumber) p2PhoneNumber = null;
  if (p3PhoneNumber === phoneNumber || p3PhoneNumber === p1PhoneNumber || p3PhoneNumber === p2PhoneNumber) p3PhoneNumber = null;

  // 2. CHECK FOR CROSS-PARTY DUPLICATES
  const submittedEmails = [email, p1Email, p2Email, p3Email].filter(e => e !== null && e !== '');
  const submittedPhones = [phoneNumber, p1PhoneNumber, p2PhoneNumber, p3PhoneNumber].filter(p => p !== null && p !== '');
  
  const allExisting = await db.select().from(guests);
  for (const g of allExisting) {
    if (g.id === id) continue; // Skip checking against themselves
    
    const existingEmails = [g.email, g.p1Email, g.p2Email, g.p3Email].filter(e => e !== null && e !== '');
    const existingPhones = [g.phoneNumber, g.p1PhoneNumber, g.p2PhoneNumber, g.p3PhoneNumber].filter(p => p !== null && p !== '');

    const hasDupEmail = submittedEmails.some(e => existingEmails.includes(e));
    const hasDupPhone = submittedPhones.some(p => existingPhones.includes(p));

    if (hasDupEmail || hasDupPhone) {
      return redirect('/tickets?error=duplicate');
    }
  }

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
  } catch (e: any) {
    if (e.code === '23505') { // Postgres Unique Violation
      return redirect('/tickets?error=duplicate');
    }
    console.error("Database update error:", e);
    return new Response('Internal Server Error while saving RSVP', { status: 500 });
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