import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const { url, cookies, redirect } = context;
  const roleCookie = cookies.get('role');
  const role = roleCookie ? roleCookie.value : null;

  // Protect the /admin dashboard (Only Trent & Shy)
  if (url.pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return redirect('/'); 
    }
  }

  // Protect the /backstage pages (Wedding Party & Admins)
  if (url.pathname.startsWith('/backstage')) {
    if (role !== 'party' && role !== 'admin') {
      return redirect('/'); 
    }
  }

  // If they pass the checks (or are on a public page), let them through
  return next();
});