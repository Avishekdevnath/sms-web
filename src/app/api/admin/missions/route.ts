import { NextRequest, NextResponse } from "next/server";

// ✅ REDIRECT TO V2 API
// This route now redirects all requests to the V2 missions API
// to ensure complete V2 adoption

export async function GET(request: NextRequest) {
  // Redirect to V2 missions API
  const url = new URL(request.url);
  url.pathname = '/api/v2/missions';
  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  // Redirect to V2 missions API
  const url = new URL(request.url);
  url.pathname = '/api/v2/missions';
  return NextResponse.redirect(url);
}

export async function PATCH(request: NextRequest) {
  // Redirect to V2 missions API
  const url = new URL(request.url);
  url.pathname = '/api/v2/missions';
  return NextResponse.redirect(url);
}

export async function DELETE(request: NextRequest) {
  // Redirect to V2 missions API
  const url = new URL(request.url);
  url.pathname = '/api/v2/missions';
  return NextResponse.redirect(url);
} 