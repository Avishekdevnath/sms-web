import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ 
    message: 'Dynamic rendering enabled',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Dynamic rendering enabled',
    timestamp: new Date().toISOString()
  });
}
