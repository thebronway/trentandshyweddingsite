import type { APIRoute } from 'astro';
import { db, Guest, eq } from 'astro:db';

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
  const p1Attending = allocatedPlusOnes >= 1 ? (formData.get('p1Attending') === 'true') : false;
  const p1MealChoice = p1Attending ? (formData.get('p1MealChoice')?.toString() || null) : null;

  // +2 Data
  const p2Name = allocatedPlusOnes >= 2 ? (formData.get('p2Name')?.toString().trim() || null) : null;
  const p2Attending = allocatedPlusOnes >= 2 ? (formData.get('p2Attending') === 'true') : false;
  const p2MealChoice = p2Attending ? (formData.get('p2MealChoice')?.toString() || null) : null;

  // +3 Data
  const p3Name = allocatedPlusOnes >= 3 ? (formData.get('p3Name')?.toString().trim() || null) : null;
  const p3Attending = allocatedPlusOnes >= 3 ? (formData.get('p3Attending') === 'true') : false;
  const p3MealChoice = p3Attending ? (formData.get('p3MealChoice')?.toString() || null) : null;

  if (action === 'delete' && id) {
    await db.delete(Guest).where(eq(Guest.id, id));
    return redirect('/admin/');
  } 
  
  // ... Keep the rest of your edit and add logic exactly the same ...
  if (action === 'edit' && id) {
    try {
      await db.update(Guest).set({ 
        firstName, lastName, email, role, allocatedPlusOnes, hasRsvpd, isAttending, mealChoice, dietaryNotes,
        p1Name, p1Attending, p1MealChoice, p2Name, p2Attending, p2MealChoice, p3Name, p3Attending, p3MealChoice
      }).where(eq(Guest.id, id));
    } catch (e) {
      return redirect('/admin/?error=duplicate');
    }
    return redirect('/admin/');
  }
  
  if (action === 'add') {
    try {
      await db.insert(Guest).values({
        firstName, lastName, email, role, allocatedPlusOnes, hasRsvpd: false, isAttending: false
      });
    } catch (e) {
      return redirect('/admin/?error=duplicate');
    }
  }

  return redirect('/admin/');
};