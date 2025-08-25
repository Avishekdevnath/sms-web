import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { StudentProfile } from "@/models/StudentProfile";

const schema = z.object({
  username: z.string().min(3).max(50),
  phone: z.string().min(10).max(15),
  avatarUrl: z.string().url().optional(),
  profileCompleted: z.boolean().default(true)
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["student"]);

    const body = await req.json();
    const input = schema.parse(body);

    // Check if username is already taken
    const existingProfile = await StudentProfile.findOne({ 
      username: input.username,
      userId: { $ne: me._id }
    }).lean();

    if (existingProfile) {
      return Response.json({ 
        error: { code: "CONFLICT.DUPLICATE", message: "Username already taken" } 
      }, { status: 409 });
    }

    // Update or create student profile
    await StudentProfile.findOneAndUpdate(
      { userId: me._id },
      { 
        $set: {
          username: input.username,
          phone: input.phone,
          avatarUrl: input.avatarUrl || "",
          profileCompleted: input.profileCompleted
        }
      },
      { upsert: true, new: true }
    );

    return Response.json({ ok: true, message: "Profile updated successfully" });
  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) {
      return Response.json({ 
        error: { code: "VALIDATION.ERROR", details: (err as { issues: unknown }).issues } 
      }, { status: 400 });
    }
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["student"]);

    // Find the student profile
    const profile = await StudentProfile.findOne({ userId: me._id }).lean();
    
    if (!profile) {
      return Response.json({ 
        error: { 
          code: "NOT_FOUND", 
          message: "Student profile not found" 
        } 
      }, { status: 404 });
    }

    return Response.json({ data: profile });

  } catch (err: unknown) {
    console.error('Error fetching student profile:', err);
    
    return Response.json({ 
      error: { 
        code: "INTERNAL", 
        message: "Internal server error" 
      } 
    }, { status: 500 });
  }
} 