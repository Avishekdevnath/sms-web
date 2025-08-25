import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyUserToken } from "@/lib/auth";

const schema = z.object({ token: z.string().min(1), newPassword: z.string().min(6) });

export async function POST(req: NextRequest) {
  await connectToDatabase();
  try {
    const body = await req.json();
    const { token, newPassword } = schema.parse(body);
    const payload = verifyUserToken(token);
    const hash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(payload._id, { password: hash });
    return Response.json({ ok: true });
  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) return Response.json({ error: { code: "VALIDATION.ERROR" } }, { status: 400 });
    return Response.json({ error: { code: "AUTH.INVALID_TOKEN" } }, { status: 401 });
  }
} 