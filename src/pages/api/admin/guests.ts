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
  
  const rawEmail = formData.get('email')?.toString().trim().toLowerCase();
  const email = rawEmail ? rawEmail : null; 

  const rawPhone = formData.get('phoneNumber')?.toString() || null;
  const phoneNumber = rawPhone ? rawPhone.replace(/\D/g, '').replace(/^1/, '') : null;

  if (!email && !phoneNumber && action !== 'delete') {
    return redirect('/admin/?error=duplicate'); 
  }

  const role = formData.get('role')?.toString() || 'guest';
  const allocatedPlusOnes = Number(formData.get('allocatedPlusOnes')) || 0;

  const rsvpStatus = formData.get('rsvpStatus')?.toString() || 'pending';
  const hasRsvpd = rsvpStatus !== 'pending';
  const isAttending = rsvpStatus === 'attending';
  
  const sanitizeText = (str: string | undefined) => str ? str.replace(/[\r\n]+/g, ' ').trim() : null;
  const dietaryNotes = sanitizeText(formData.get('dietaryNotes')?.toString());
  const songRequest = sanitizeText(formData.get('songRequest')?.toString());
  
  const extractPhone = (val: string | undefined) => val ? val.replace(/\D/g, '').replace(/^1/, '') : null;

  // +1 Data
  const p1Name = allocatedPlusOnes >= 1 ? (formData.get('p1Name')?.toString().trim() || null) : null;
  let p1Email = allocatedPlusOnes >= 1 ? (formData.get('p1Email')?.toString().trim().toLowerCase() || null) : null;
  let p1PhoneNumber = allocatedPlusOnes >= 1 ? extractPhone(formData.get('p1PhoneNumber')?.toString()) : null;
  const p1Attending = allocatedPlusOnes >= 1 ? (formData.get('p1Attending')?.toString() || 'pending') : 'pending';

  // +2 Data
  const p2Name = allocatedPlusOnes >= 2 ? (formData.get('p2Name')?.toString().trim() || null) : null;
  let p2Email = allocatedPlusOnes >= 2 ? (formData.get('p2Email')?.toString().trim().toLowerCase() || null) : null;
  let p2PhoneNumber = allocatedPlusOnes >= 2 ? extractPhone(formData.get('p2PhoneNumber')?.toString()) : null;
  const p2Attending = allocatedPlusOnes >= 2 ? (formData.get('p2Attending')?.toString() || 'pending') : 'pending';

  // +3 Data
  const p3Name = allocatedPlusOnes >= 3 ? (formData.get('p3Name')?.toString().trim() || null) : null;
  let p3Email = allocatedPlusOnes >= 3 ? (formData.get('p3Email')?.toString().trim().toLowerCase() || null) : null;
  let p3PhoneNumber = allocatedPlusOnes >= 3 ? extractPhone(formData.get('p3PhoneNumber')?.toString()) : null;
  const p3Attending = allocatedPlusOnes >= 3 ? (formData.get('p3Attending')?.toString() || 'pending') : 'pending';

  // SILENTLY DEDUPLICATE INTRA-PARTY INFO
  if (p1Email === email) p1Email = null;
  if (p2Email === email || p2Email === p1Email) p2Email = null;
  if (p3Email === email || p3Email === p1Email || p3Email === p2Email) p3Email = null;

  if (p1PhoneNumber === phoneNumber) p1PhoneNumber = null;
  if (p2PhoneNumber === phoneNumber || p2PhoneNumber === p1PhoneNumber) p2PhoneNumber = null;
  if (p3PhoneNumber === phoneNumber || p3PhoneNumber === p1PhoneNumber || p3PhoneNumber === p2PhoneNumber) p3PhoneNumber = null;

  const isAjax = request.headers.get('accept')?.includes('application/json');

  if (action === 'add' || action === 'edit') {
    const submittedEmails = [email, p1Email, p2Email, p3Email].filter(e => e !== null && e !== '');
    const submittedPhones = [phoneNumber, p1PhoneNumber, p2PhoneNumber, p3PhoneNumber].filter(p => p !== null && p !== '');
    
    const allExisting = await db.select().from(guests);
    for (const g of allExisting) {
      if (action === 'edit' && g.id === id) continue; // Skip self when editing
      
      const existingEmails = [g.email, g.p1Email, g.p2Email, g.p3Email].filter(e => e !== null && e !== '');
      const existingPhones = [g.phoneNumber, g.p1PhoneNumber, g.p2PhoneNumber, g.p3PhoneNumber].filter(p => p !== null && p !== '');

      const hasDupEmail = submittedEmails.some(e => existingEmails.includes(e));
      const hasDupPhone = submittedPhones.some(p => existingPhones.includes(p));

      if (hasDupEmail || hasDupPhone) {
        if (isAjax) {
          return new Response(JSON.stringify({ error: "Duplicate email or phone number found across guests." }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }
        return redirect('/admin/?error=duplicate');
      }
    }
  }

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
        firstName, lastName, email, phoneNumber, role, allocatedPlusOnes, hasRsvpd, isAttending, dietaryNotes, songRequest,
        p1Name, p1Email, p1PhoneNumber, p1Attending, 
        p2Name, p2Email, p2PhoneNumber, p2Attending, 
        p3Name, p3Email, p3PhoneNumber, p3Attending
      }).where(eq(guests.id, id));
      
      const editedGuest = await db.select().from(guests).where(eq(guests.id, id));
      const allGuests = await db.select().from(guests);
      if (editedGuest.length > 0) {
        await sendAdminNotification(editedGuest[0], allGuests, 'Admin Edited Guest');
      }
      if (isAjax) return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    } catch (e) {
      if (isAjax) return new Response(JSON.stringify({ error: "Database error occurred." }), { status: 400, headers: { 'Content-Type': 'application/json' }});
      return redirect('/admin/?error=duplicate');
    }
    return redirect('/admin/');
  }
  
  if (action === 'add') {
    try {
      await db.insert(guests).values({
        firstName, lastName, email, phoneNumber, role, allocatedPlusOnes, hasRsvpd: false, isAttending: false
      });
      
      const conditions = [];
      if (email) conditions.push(eq(guests.email, email));
      if (phoneNumber) conditions.push(eq(guests.phoneNumber, phoneNumber));
      const newGuest = await db.select().from(guests).where(conditions[0]);
      const allGuests = await db.select().from(guests);
      if (newGuest.length > 0) {
        await sendAdminNotification(newGuest[0], allGuests, 'Admin Added Guest');
      }
      if (isAjax) return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    } catch (e) {
      if (isAjax) return new Response(JSON.stringify({ error: "Database error occurred." }), { status: 400, headers: { 'Content-Type': 'application/json' }});
      return redirect('/admin/?error=duplicate');
    }
  }

  return redirect('/admin/');
};