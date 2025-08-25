import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() }, {
      _id: 1,
      email: 1,
      passwordExpiresAt: 1,
      profileCompleted: 1
    }).lean();

    if (!user) {
      return Response.json({
        success: false,
        error: "User not found"
      });
    }

    return Response.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        hasTemporaryPassword: !!user.passwordExpiresAt,
        passwordExpiresAt: user.passwordExpiresAt,
        profileCompleted: user.profileCompleted
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
