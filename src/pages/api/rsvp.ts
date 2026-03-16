import type { APIRoute } from 'astro';
import { db, Guest, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const email = formData.get('email')?.toString().toLowerCase();
  
  if (!email) return new Response('Email required', { status: 400 });

  const isAttending = formData.get('isAttending') === 'true';
  const p1Attending = formData.get('p1Attending') === 'true';
  const p2Attending = formData.get('p2Attending') === 'true';
  const p3Attending = formData.get('p3Attending') === 'true';

  await db.update(Guest)
    .set({ 
      isAttending, 
      // If not attending, FORCE meal to null
      mealChoice: isAttending ? (formData.get('mealChoice')?.toString() || null) : null, 
      dietaryNotes: formData.get('dietaryNotes')?.toString() || null,
      
      p1Attending,
      p1MealChoice: p1Attending ? (formData.get('p1MealChoice')?.toString() || null) : null,
      
      p2Attending,
      p2MealChoice: p2Attending ? (formData.get('p2MealChoice')?.toString() || null) : null,
      
      p3Attending,
      p3MealChoice: p3Attending ? (formData.get('p3MealChoice')?.toString() || null) : null,
      
      hasRsvpd: true 
    })
    .where(eq(Guest.email, email));

  return redirect('/tickets?success=true');
};