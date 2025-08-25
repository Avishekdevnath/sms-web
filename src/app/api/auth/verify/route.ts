import { NextRequest } from "next/server";
import { verifyUserToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ 
        error: { 
          code: "AUTH.NO_TOKEN", 
          message: "No token provided" 
        } 
      }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the token
      const user = verifyUserToken(token);
      
      if (!user || !user._id || !user.role) {
        throw new Error('Invalid token structure');
      }

      // Return user data
      return Response.json({ 
        user: { 
          _id: user._id, 
          email: user.email, 
          role: user.role, 
          name: user.name 
        } 
      });
    } catch (tokenError) {
      return Response.json({ 
        error: { 
          code: "AUTH.INVALID_TOKEN", 
          message: "Invalid or expired token" 
        } 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL", 
        message: "An error occurred during token verification" 
      } 
    }, { status: 500 });
  }
}
