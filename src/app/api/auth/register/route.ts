import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { generateNextUserId } from "@/lib/userid";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["admin", "developer", "manager", "sre", "mentor", "student"]),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email, password, name, role } = schema.parse(json);

    await connectToDatabase();
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return Response.json({ error: { code: "CONFLICT.DUPLICATE", message: "Email already registered" } }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = await generateNextUserId(role);
    const user = await User.create({ userId, email, password: hash, name, role });

    return Response.json({ _id: user._id, userId: user.userId, email: user.email, role: user.role, name: user.name }, { status: 201 });
  } catch (err: unknown) {
    const isZodError = typeof err === "object" && err !== null && "issues" in err;
    if (isZodError) {
      return Response.json({ error: { code: "VALIDATION.ERROR", message: "Invalid payload", details: (err as { issues: unknown }).issues } }, { status: 400 });
    }
    return Response.json({ error: { code: "INTERNAL", message: "Something went wrong" } }, { status: 500 });
  }
} 