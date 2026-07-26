import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { settings } from '../../../db/schema';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  
  const openDateStr = formData.get('rsvpOpenDate')?.toString() || '';
  const closeDateStr = formData.get('rsvpCloseDate')?.toString() || '';

  const rsvpOpenDate = new Date(openDateStr);
  const rsvpCloseDate = new Date(closeDateStr);
  
  const earlyMessage = formData.get('earlyMessage')?.toString() || '';
  const lateMessage = formData.get('lateMessage')?.toString() || '';

  const existingSettings = await db.select().from(settings).limit(1);

  if (existingSettings.length > 0) {
    await db.update(settings).set({
      rsvpOpenDate, rsvpCloseDate, earlyMessage, lateMessage
    });
  } else {
    await db.insert(settings).values({
      rsvpOpenDate, rsvpCloseDate, earlyMessage, lateMessage
    });
  }

  return redirect('/admin?success=settings');
};