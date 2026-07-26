import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { guests } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { guestId, target, status } = body;

    if (!guestId || !target) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    const updateData: any = {};
    const timestamp = status ? new Date() : null;

    if (target === 'main') {
      updateData.isCheckedIn = status;
      updateData.checkInTime = timestamp;
    } else if (target === 'p1') {
      updateData.p1CheckedIn = status;
      updateData.p1CheckInTime = timestamp;
    } else if (target === 'p2') {
      updateData.p2CheckedIn = status;
      updateData.p2CheckInTime = timestamp;
    } else if (target === 'p3') {
      updateData.p3CheckedIn = status;
      updateData.p3CheckInTime = timestamp;
    }

    await db.update(guests).set(updateData).where(eq(guests.id, guestId));

    let formattedTime = null;
    if (timestamp) {
      formattedTime = timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    return new Response(JSON.stringify({ success: true, timestamp, formattedTime }), { status: 200 });
  } catch (error) {
    console.error("Check-in error:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};