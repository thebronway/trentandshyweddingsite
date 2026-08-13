import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { settings } from '../../../db/schema';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  
  const staffCount = parseInt(formData.get('staffCount')?.toString() || '0', 10);
  const staffDietaryNotes = formData.get('staffDietaryNotes')?.toString() || '';

  const existingSettings = await db.select().from(settings).limit(1);

  if (existingSettings.length > 0) {
    await db.update(settings).set({
      staffCount,
      staffDietaryNotes
    });
  }

  return redirect('/admin/catering?success=true');
};