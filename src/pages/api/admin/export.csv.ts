import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { guests } from '../../../db/schema';

export const GET: APIRoute = async () => {
  const allGuests = await db.select().from(guests);
  
  const header = "ID,FirstName,LastName,Email,Phone,Role,PartyAlloc,HasRSVPD,MainAttending,P1Name,P1Attending,P2Name,P2Attending,P3Name,P3Attending,DietaryNotes,SongRequest\n";
  
  const escapeCSV = (str: string | null) => str ? `"${str.replace(/"/g, '""')}"` : '""';

  const rows = allGuests.map(g => {
    const p1Att = g.allocatedPlusOnes >= 1 ? g.p1Attending : '';
    const p2Att = g.allocatedPlusOnes >= 2 ? g.p2Attending : '';
    const p3Att = g.allocatedPlusOnes >= 3 ? g.p3Attending : '';
    
    return `${g.id},${escapeCSV(g.firstName)},${escapeCSV(g.lastName)},${escapeCSV(g.email)},${escapeCSV(g.phoneNumber)},${g.role},${g.allocatedPlusOnes},${g.hasRsvpd},${g.isAttending},${escapeCSV(g.p1Name)},${p1Att},${escapeCSV(g.p2Name)},${p2Att},${escapeCSV(g.p3Name)},${p3Att},${escapeCSV(g.dietaryNotes)},${escapeCSV(g.songRequest)}`;
  }).join('\n');

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="trent_and_shy_guest_list.csv"'
    }
  });
};