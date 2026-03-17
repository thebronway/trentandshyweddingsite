import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const { url, cookies, redirect } = context;
  const roleCookie = cookies.get('role');
  const role = roleCookie ? roleCookie.value : null;

  // Allow internal Astro assets and public files to load normally
  const isAsset = url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname === '/favicon.svg';
  
  // Allow the homepage (login) and the verification endpoint
  const isPublicRoute = url.pathname === '/' || url.pathname === '/api/verify';

  // 1. General Site Protection: Kick them out if they have no role and aren't on a public route/asset
  if (!role && !isPublicRoute && !isAsset) {
    // Pass the requested URL so we can redirect them back after login
    return redirect(`/?redirectTo=${encodeURIComponent(url.pathname)}`);
  }

  // 2. Protect the /admin dashboard AND /api/admin endpoints (Only Trent & Shy)
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/admin')) {
    if (role !== 'admin') {
      return redirect('/'); 
    }
  }

  // 3. Protect the /backstage pages (Wedding Party & Admins)
  if (url.pathname.startsWith('/backstage')) {
    if (role !== 'party' && role !== 'admin') {
      return redirect('/'); 
    }
  }

  // If they pass the checks, let them through
  return next();
});