import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { guests } from '../../../db/schema';

export const GET: APIRoute = async () => {
  const allGuests = await db.select().from(guests);
  
  const header = "ID,FirstName,LastName,Email,Role,PartyAlloc,HasRSVPD,MainAttending,MainMeal,P1Name,P1Attending,P1Meal,P2Name,P2Attending,P2Meal,P3Name,P3Attending,P3Meal,DietaryNotes,SongRequest\n";
  
  // Safely wrap text fields in double quotes and escape internal quotes to prevent CSV breakage
  const escapeCSV = (str: string | null) => str ? `"${str.replace(/"/g, '""')}"` : '""';

  const rows = allGuests.map(g => {
    // Only output the attending status if they were actually allocated that slot
    const p1Att = g.allocatedPlusOnes >= 1 ? g.p1Attending : '';
    const p2Att = g.allocatedPlusOnes >= 2 ? g.p2Attending : '';
    const p3Att = g.allocatedPlusOnes >= 3 ? g.p3Attending : '';
    
    return `${g.id},${escapeCSV(g.firstName)},${escapeCSV(g.lastName)},${escapeCSV(g.email)},${g.role},${g.allocatedPlusOnes},${g.hasRsvpd},${g.isAttending},${escapeCSV(g.mealChoice)},${escapeCSV(g.p1Name)},${p1Att},${escapeCSV(g.p1MealChoice)},${escapeCSV(g.p2Name)},${p2Att},${escapeCSV(g.p2MealChoice)},${escapeCSV(g.p3Name)},${p3Att},${escapeCSV(g.p3MealChoice)},${escapeCSV(g.dietaryNotes)},${escapeCSV(g.songRequest)}`;
  }).join('\n');

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="trent_and_shy_guest_list.csv"'
    }
  });
};