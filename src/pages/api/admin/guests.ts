import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { guests } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { sendAdminNotification } from '../../../utils/email';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const action = formData.get('action')?.toString();
  const id = Number(formData.get('id'));

  const firstName = formData.get('firstName')?.toString().trim() || '';
  const lastName = formData.get('lastName')?.toString().trim() || null;
  const email = formData.get('email')?.toString().trim().toLowerCase() || '';
  const role = formData.get('role')?.toString() || 'guest';
  const allocatedPlusOnes = Number(formData.get('allocatedPlusOnes')) || 0;

  const rsvpStatus = formData.get('rsvpStatus')?.toString() || 'pending';
  const hasRsvpd = rsvpStatus !== 'pending';
  const isAttending = rsvpStatus === 'attending';
  
  // FORCE meal to null if not attending
  const mealChoice = isAttending ? (formData.get('mealChoice')?.toString() || null) : null;
  const dietaryNotes = formData.get('dietaryNotes')?.toString().trim() || null;
  
  // +1 Data
  const p1Name = allocatedPlusOnes >= 1 ? (formData.get('p1Name')?.toString().trim() || null) : null;
  const p1Attending = allocatedPlusOnes >= 1 ? (formData.get('p1Attending')?.toString() || 'pending') : 'pending';
  const p1MealChoice = p1Attending === 'true' ? (formData.get('p1MealChoice')?.toString() || null) : null;

  // +2 Data
  const p2Name = allocatedPlusOnes >= 2 ? (formData.get('p2Name')?.toString().trim() || null) : null;
  const p2Attending = allocatedPlusOnes >= 2 ? (formData.get('p2Attending')?.toString() || 'pending') : 'pending';
  const p2MealChoice = p2Attending === 'true' ? (formData.get('p2MealChoice')?.toString() || null) : null;

  // +3 Data
  const p3Name = allocatedPlusOnes >= 3 ? (formData.get('p3Name')?.toString().trim() || null) : null;
  const p3Attending = allocatedPlusOnes >= 3 ? (formData.get('p3Attending')?.toString() || 'pending') : 'pending';
  const p3MealChoice = p3Attending === 'true' ? (formData.get('p3MealChoice')?.toString() || null) : null;

  if (action === 'delete' && id) {
    // Grab the name before deleting so we can put it in the email subject line
    const deletedGuest = await db.select().from(guests).where(eq(guests.id, id));
    await db.delete(guests).where(eq(guests.id, id));
    
    const allGuests = await db.select().from(guests);
    if (deletedGuest.length > 0) {
      await sendAdminNotification(deletedGuest[0], allGuests, 'Admin Deleted Guest');
    }
    return redirect('/admin/');
  }
  
  if (action === 'edit' && id) {
    try {
      await db.update(guests).set({ 
        firstName, lastName, email, role, allocatedPlusOnes, hasRsvpd, isAttending, mealChoice, dietaryNotes,
        p1Name, p1Attending, p1MealChoice, p2Name, p2Attending, p2MealChoice, p3Name, p3Attending, p3MealChoice
      }).where(eq(guests.id, id));
      
      const editedGuest = await db.select().from(guests).where(eq(guests.id, id));
      const allGuests = await db.select().from(guests);
      if (editedGuest.length > 0) {
        await sendAdminNotification(editedGuest[0], allGuests, 'Admin Edited Guest');
      }
    } catch (e) {
      return redirect('/admin/?error=duplicate');
    }
    return redirect('/admin/');
  }
  
  if (action === 'add') {
    try {
      await db.insert(guests).values({
        firstName, lastName, email, role, allocatedPlusOnes, hasRsvpd: false, isAttending: false
      });
      
      const newGuest = await db.select().from(guests).where(eq(guests.email, email));
      const allGuests = await db.select().from(guests);
      if (newGuest.length > 0) {
        await sendAdminNotification(newGuest[0], allGuests, 'Admin Added Guest');
      }
    } catch (e) {
      return redirect('/admin/?error=duplicate');
    }
  }

  return redirect('/admin/');
};