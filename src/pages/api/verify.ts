import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();
  
  const presaleCode = data.get('code')?.toString().toLowerCase().replace(/ /g, '');
  const redirectTo = data.get('redirectTo')?.toString() || '/about';

  const adminPass = process.env.ADMIN_PASSWORD?.toLowerCase().replace(/ /g, '');
  const vipPass = process.env.VIP_PASSWORD?.toLowerCase().replace(/ /g, '');
  const guestPass = process.env.GUEST_PASSWORD?.toLowerCase().replace(/ /g, '');

  const cookieOptions = { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true, secure: import.meta.env.PROD, sameSite: 'strict' as const };

  if (presaleCode === adminPass) {
    cookies.set('role', 'admin', cookieOptions);
    return redirect(redirectTo);
  } 
  
  if (presaleCode === vipPass) {
    cookies.set('role', 'party', cookieOptions);
    return redirect(redirectTo);
  } 
  
  if (presaleCode === guestPass) {
    cookies.set('role', 'guest', cookieOptions);
    return redirect(redirectTo);
  }

  // On error, make sure we keep the redirectTo parameter in the URL so it's not lost
  return redirect(`/?error=invalid&redirectTo=${encodeURIComponent(redirectTo)}`);
};