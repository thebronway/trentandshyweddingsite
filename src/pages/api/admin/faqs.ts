import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { faqs } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const POST: APIRoute = async ({ request, redirect }) => {
  const contentType = request.headers.get("content-type") || "";

  // Handle JSON Reorder payload
  if (contentType.includes("application/json")) {
    const data = await request.json();
    if (data.action === 'reorder' && Array.isArray(data.order)) {
      for (let i = 0; i < data.order.length; i++) {
        await db.update(faqs).set({ sortOrder: i }).where(eq(faqs.id, parseInt(data.order[i])));
      }
      return new Response("OK", { status: 200 });
    }
  }

  // Handle Form Data
  const formData = await request.formData();
  const action = formData.get('action')?.toString();

  if (action === 'add') {
    const question = formData.get('question')?.toString() || '';
    const answer = formData.get('answer')?.toString() || '';
    
    // Get highest current sort order
    const all = await db.select().from(faqs);
    const maxOrder = all.length > 0 ? Math.max(...all.map(f => f.sortOrder)) : -1;

    await db.insert(faqs).values({ question, answer, sortOrder: maxOrder + 1 });
  } else if (action === 'delete') {
    const id = parseInt(formData.get('id')?.toString() || '0');
    if (id) await db.delete(faqs).where(eq(faqs.id, id));
  }

  return redirect('/admin/faqs');
};