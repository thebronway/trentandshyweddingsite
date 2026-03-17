import type { APIRoute } from 'astro';
import { db } from '../../db';
import { guests } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sendGuestConfirmation, sendAdminNotification } from '../../utils/email';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().toLowerCase();
  
  if (!email) return new Response('Email required', { status: 400 });

  const existingGuest = await db.select().from(guests).where(eq(guests.email, email));
  const isUpdate = existingGuest.length > 0 && existingGuest[0].hasRsvpd;

  const isAttending = formData.get('isAttending') === 'true';
  const p1Attending = formData.get('p1Attending')?.toString() || 'pending';
  const p2Attending = formData.get('p2Attending')?.toString() || 'pending';
  const p3Attending = formData.get('p3Attending')?.toString() || 'pending';

  // Strip line breaks so they don't mess up simple CSV viewers
  const sanitizeText = (str: string | undefined) => str ? str.replace(/[\r\n]+/g, ' ').trim() : null;

  await db.update(guests)
    .set({ 
      isAttending, 
      mealChoice: isAttending ? (formData.get('mealChoice')?.toString() || null) : null, 
      dietaryNotes: sanitizeText(formData.get('dietaryNotes')?.toString()),
      songRequest: sanitizeText(formData.get('songRequest')?.toString()),
      p1Attending,
      p1MealChoice: p1Attending === 'true' ? (formData.get('p1MealChoice')?.toString() || null) : null,
      p2Attending,
      p2MealChoice: p2Attending === 'true' ? (formData.get('p2MealChoice')?.toString() || null) : null,
      p3Attending,
      p3MealChoice: p3Attending === 'true' ? (formData.get('p3MealChoice')?.toString() || null) : null,
      hasRsvpd: true 
    })
    .where(eq(guests.email, email));

  // Fetch the fresh records to send in the emails
  const updatedGuestQuery = await db.select().from(guests).where(eq(guests.email, email));
  const allGuests = await db.select().from(guests);

  // Send the guest email, then send the admin the updated CSV
  if (updatedGuestQuery.length > 0) {
    await sendGuestConfirmation(updatedGuestQuery[0], isUpdate);
    await sendAdminNotification(updatedGuestQuery[0], allGuests, isUpdate ? 'Updated RSVP' : 'Initial RSVP');
  }

  return redirect('/tickets?success=true');
};