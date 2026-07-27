import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { guests } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { guestId, target, password } = body;

    const normalizedInput = password.replace(/\s+/g, '').toLowerCase();
    const validOverride = process.env.OVERRIDE_PASSWORD?.replace(/\s+/g, '').toLowerCase() 
                       || process.env.ADMIN_PASSWORD?.replace(/\s+/g, '').toLowerCase();
    
    if (normalizedInput !== validOverride) {
        return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 403 });
    }

    if (!guestId || !target) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    const updateData: any = { hasRsvpd: true };
    const now = new Date();

    if (target === 'main') {
      updateData.isAttending = true;
      updateData.isCheckedIn = true;
      updateData.checkInTime = now;
    } else if (target === 'p1') {
      updateData.p1Attending = 'true';
      updateData.p1CheckedIn = true;
      updateData.p1CheckInTime = now;
    } else if (target === 'p2') {
      updateData.p2Attending = 'true';
      updateData.p2CheckedIn = true;
      updateData.p2CheckInTime = now;
    } else if (target === 'p3') {
      updateData.p3Attending = 'true';
      updateData.p3CheckedIn = true;
      updateData.p3CheckInTime = now;
    }

    await db.update(guests).set(updateData).where(eq(guests.id, guestId));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Walk-Up Override error:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};