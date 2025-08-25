import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Clear the token cookie
    const headers = new Headers();
    headers.append("Set-Cookie", "token=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
    
    return new Response(JSON.stringify({ message: "Logged out successfully" }), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL", 
        message: "An error occurred during logout" 
      } 
    }, { status: 500 });
  }
} 