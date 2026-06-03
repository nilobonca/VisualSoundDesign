
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
    // Only run this middleware for /admin routes
    if (!req.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    // Get client IP
    // In Next.js (vercel/node), this is typically in 'x-forwarded-for' or 'req.ip' depending on hosting.
    // 'req.ip' works in most generic Next.js middleware contexts.
    let ip = (req as any).ip || req.headers.get('x-forwarded-for') || '::1';

    // Handle comma-separated headers (proxies)
    if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    const allowedIps = (process.env.ADMIN_ALLOWED_IPS || '').split(',').map(i => i.trim());

    // If no IPs allowed configured, block everything by default for safety, or allow local?
    // Let's block if env is set but empty, or maybe allow localhost by default for dev?
    // User asked for whitelist, so strict is better. 
    // BUT we need to ensure they don't lock themselves out in dev.
    // Let's add '::1' and '127.0.0.1' to allowed list by default if in dev, or just rely on env.

    if (!allowedIps.includes(ip)) {
        // Allow localhost during development automatically if not specified? 
        // Better to just require the user to add it to env.
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/admin/:path*',
};
