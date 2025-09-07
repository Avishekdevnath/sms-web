import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signUserToken } from "@/lib/auth";
import type { IUser } from "@/models/User";

const schema = z.object({ 
  loginIdentifier: z.string().min(1, "Login identifier is required"), 
  loginMethod: z.enum(["email", "username", "phone"], { 
    required_error: "Login method is required" 
  }),
  password: z.string().min(6, "Password must be at least 6 characters") 
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { loginIdentifier, loginMethod, password } = schema.parse(json);

    await connectToDatabase();
    
    // Build query based on login method
    let query: any = {
      isActive: true,
      deletedAt: { $exists: false }
    };

    if (loginMethod === "email") {
      query.email = loginIdentifier.toLowerCase();
    } else if (loginMethod === "username") {
      query.username = loginIdentifier;
    } else if (loginMethod === "phone") {
      query.phone = loginIdentifier;
    }

    // Find user and check if active
    const user = (await User.findOne(query).lean()) as unknown as IUser | null;
    
    if (!user) {
      return Response.json({ 
        error: { 
          code: "AUTH.INVALID_CREDENTIALS", 
          message: "Invalid email or password" 
        } 
      }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return Response.json({ 
        error: { 
          code: "AUTH.INVALID_CREDENTIALS", 
          message: "Invalid email or password" 
        } 
      }, { status: 401 });
    }

    // Check if password has expired (for temporary student accounts)
    if (user.passwordExpiresAt && new Date() > user.passwordExpiresAt) {
      return Response.json({ 
        error: { 
          code: "AUTH.PASSWORD_EXPIRED", 
          message: "Your temporary password has expired. Please contact an administrator to request a new invitation." 
        } 
      }, { status: 401 });
    }

    // Generate JWT token
    const tokenPayload = { 
      _id: String(user._id), 
      email: user.email, 
      role: user.role, 
      name: user.name 
    };
    
    console.log('Creating token with payload:', tokenPayload);
    
    const token = signUserToken(tokenPayload);
    
    console.log('Token generated successfully, length:', token.length);

    // Set secure cookie
    const headers = new Headers();
    const isProduction = process.env.NODE_ENV === 'production';
    const secureFlag = isProduction ? '; Secure' : '';
    const sameSiteFlag = isProduction ? '; SameSite=Strict' : '; SameSite=Lax';
    
    // Calculate expiration date (7 days from now)
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    
    headers.append("Set-Cookie", `token=${token}; Path=/; Expires=${expires.toUTCString()}; Max-Age=604800${secureFlag}${sameSiteFlag}`);

    // Return user data (without sensitive information)
    return new Response(JSON.stringify({ 
      user: { 
        _id: user._id, 
        email: user.email, 
        role: user.role, 
        name: user.name,
        userId: user.userId,
        profileCompleted: user.profileCompleted,
        passwordExpiresAt: user.passwordExpiresAt // Include this to check if user has temporary password
      } 
    }), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error('Login error:', err);
    
    // Handle validation errors
    if (err instanceof z.ZodError) {
      const firstError = err.issues[0];
      return Response.json({ 
        error: { 
          code: "VALIDATION.ERROR", 
          message: firstError.message 
        } 
      }, { status: 400 });
    }
    
    // Handle other errors
    if (err instanceof Error) {
      console.error('Error details:', err.message, err.stack);
      return Response.json({ 
        error: { 
          code: "INTERNAL", 
          message: "An unexpected error occurred. Please try again." 
        } 
      }, { status: 500 });
    }
    
    return Response.json({ 
      error: { 
        code: "INTERNAL", 
        message: "An unexpected error occurred. Please try again." 
      } 
    }, { status: 500 });
  }
} 