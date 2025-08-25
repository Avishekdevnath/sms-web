import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

const checkEmailsSchema = z.object({
  emails: z.array(z.string().email()).min(1, "At least one email is required")
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const body = await req.json();
    const { emails } = checkEmailsSchema.parse(body);

    // Check which emails already exist in the system
    const existingUsers = await User.find({
      email: { $in: emails.map(email => email.toLowerCase()) },
      deletedAt: { $exists: false }
    }).select('email').lean();

    const existingEmails = existingUsers.map(user => user.email);

    return Response.json({ 
      data: { existingEmails },
      message: `Found ${existingEmails.length} existing emails out of ${emails.length} total`
    });
  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) {
      return Response.json({ 
        error: { 
          code: "VALIDATION.ERROR", 
          details: (err as { issues: unknown }).issues 
        } 
      }, { status: 400 });
    }
    
    console.error('Check existing emails error:', err);
    return Response.json({ 
      error: { 
        code: "INTERNAL", 
        message: "An error occurred while checking existing emails" 
      } 
    }, { status: 500 });
  }
}
