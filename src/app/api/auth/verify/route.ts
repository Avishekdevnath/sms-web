import { NextRequest } from "next/server";
import { verifyUserToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

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
      const tokenUser = verifyUserToken(token);
      
      if (!tokenUser || !tokenUser._id || !tokenUser.role) {
        throw new Error('Invalid token structure');
      }

      // Connect to database and get complete user data
      await connectToDatabase();
      const user = await User.findById(tokenUser._id).select('_id email role name profileCompleted').lean();
      
      if (!user) {
        throw new Error('User not found in database');
      }

      // Return complete user data
      return Response.json({ 
        user: { 
          _id: user._id, 
          email: user.email, 
          role: user.role, 
          name: user.name,
          profileCompleted: user.profileCompleted
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
