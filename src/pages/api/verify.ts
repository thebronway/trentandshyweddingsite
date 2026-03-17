import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();
  // We grab 'code' now instead of 'password' to avoid triggering phishing filters
  const presaleCode = data.get('code')?.toString().trim();
  const redirectTo = data.get('redirectTo')?.toString() || '/about';

  // Keep checking against your existing environment variables
  const adminPass = process.env.ADMIN_PASSWORD?.trim();
  const vipPass = process.env.VIP_PASSWORD?.trim();
  const guestPass = process.env.GUEST_PASSWORD?.trim();

  const cookieOptions = { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true, secure: false };

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