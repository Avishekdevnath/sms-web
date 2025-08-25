import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyUserToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    
    if (!tokenCookie || !tokenCookie.value) {
      return Response.json({
        error: {
          code: "AUTH.NO_TOKEN",
          message: "No authentication token found"
        }
      }, { status: 401 });
    }

    try {
      // Add debugging
      console.log('Token received:', tokenCookie.value.substring(0, 20) + '...');
      
      // Verify the token
      const decodedUser = verifyUserToken(tokenCookie.value);
      console.log('Decoded user:', decodedUser);
      
      if (!decodedUser || !decodedUser._id) {
        throw new Error('Invalid token structure');
      }

      // Connect to database and get full user data
      await connectToDatabase();
      const user = await User.findById(decodedUser._id)
        .select('-password')
        .lean();

      if (!user) {
        return Response.json({
          error: {
            code: "AUTH.USER_NOT_FOUND",
            message: "User not found"
          }
        }, { status: 404 });
      }

      // Return user data
      return Response.json({
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
          userId: user.userId,
          profileCompleted: user.profileCompleted,
          mustChangePassword: user.mustChangePassword,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
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
    console.error('Get current user error:', error);
    return Response.json({
      error: {
        code: "INTERNAL",
        message: "An error occurred while fetching user data"
      }
    }, { status: 500 });
  }
}
