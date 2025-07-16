import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from "@/lib/env"

export function middleware(req: NextRequest) {
	if (req.nextUrl.pathname.startsWith('/api/')) {
		const upstream = API_BASE_URL + req.nextUrl.pathname;
		return NextResponse.rewrite(upstream);
	}
}

export const config = {
	matcher: ['/api/:path*'],
};