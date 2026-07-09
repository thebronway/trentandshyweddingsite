import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { guests } from '../../../db/schema';
import { parse } from 'csv-parse/sync';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const file = formData.get('csv') as File;
  
  if (!file) return redirect('/admin?error=nocsv');
  
  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true });

  for (const row of records) {
    try {
      await db.insert(guests).values({
        firstName: row.FirstName || 'Unknown',
        lastName: row.LastName || null,
        email: row.Email || null,
        phoneNumber: row.Phone || null,
        role: row.Role || 'guest',
        allocatedPlusOnes: parseInt(row.PartyAlloc) || 0,
        hasRsvpd: false,
        isAttending: false
      });
    } catch (e) {
      // Skip exact duplicates (Unique constraint violations)
      console.warn("Skipped row due to existing email/phone");
    }
  }

  return redirect('/admin?success=imported');
};