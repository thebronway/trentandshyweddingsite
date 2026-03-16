import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();
  const password = data.get('password')?.toString().trim();

  const adminPass = process.env.ADMIN_PASSWORD?.trim();
  const vipPass = process.env.VIP_PASSWORD?.trim();
  const guestPass = process.env.GUEST_PASSWORD?.trim();

  // THE FIX: secure: false (allows the cookie to survive on HTTP 8080)
  const cookieOptions = { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true, secure: false };

  // Set the specific role, but send EVERYONE to the /about page
  if (password === adminPass) {
    cookies.set('role', 'admin', cookieOptions);
    return redirect('/about');
  } 
  
  if (password === vipPass) {
    cookies.set('role', 'party', cookieOptions);
    return redirect('/about');
  } 
  
  if (password === guestPass) {
    cookies.set('role', 'guest', cookieOptions);
    return redirect('/about');
  }

  return redirect('/?error=invalid');
};