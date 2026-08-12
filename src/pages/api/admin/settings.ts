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
  
  const messageAll = formData.get('messageAll')?.toString() || '';
  const messageGuest = formData.get('messageGuest')?.toString() || '';
  const messageVip = formData.get('messageVip')?.toString() || '';
  const messageOpeners = formData.get('messageOpeners')?.toString() || '';
  const messageAdmin = formData.get('messageAdmin')?.toString() || '';

  const existingSettings = await db.select().from(settings).limit(1);

  if (existingSettings.length > 0) {
    await db.update(settings).set({
      rsvpOpenDate, rsvpCloseDate, earlyMessage, lateMessage,
      messageAll, messageGuest, messageVip, messageOpeners, messageAdmin
    });
  } else {
    await db.insert(settings).values({
      rsvpOpenDate, rsvpCloseDate, earlyMessage, lateMessage,
      messageAll, messageGuest, messageVip, messageOpeners, messageAdmin
    });
  }

  return redirect('/admin/settings?success=settings');
};