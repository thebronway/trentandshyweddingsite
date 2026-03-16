import type { APIRoute } from 'astro';
import { db, Guest } from 'astro:db';

export const GET: APIRoute = async () => {
  const guests = await db.select().from(Guest);
  
  const header = "ID,FirstName,LastName,Email,Role,PartyAlloc,HasRSVPD,MainAttending,MainMeal,P1Name,P1Attending,P1Meal,P2Name,P2Attending,P2Meal,P3Name,P3Attending,P3Meal,DietaryNotes\n";
  
  const rows = guests.map(g => {
    return `${g.id},"${g.firstName}","${g.lastName || ''}","${g.email}",${g.role},${g.allocatedPlusOnes},${g.hasRsvpd},${g.isAttending},"${g.mealChoice || ''}","${g.p1Name || ''}",${g.p1Attending},"${g.p1MealChoice || ''}","${g.p2Name || ''}",${g.p2Attending},"${g.p2MealChoice || ''}","${g.p3Name || ''}",${g.p3Attending},"${g.p3MealChoice || ''}","${g.dietaryNotes || ''}"`;
  }).join('\n');

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="trent_and_shy_guest_list.csv"'
    }
  });
};