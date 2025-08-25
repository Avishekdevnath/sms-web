import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const mongoose = await connectToDatabase();
    // ping admin to confirm connectivity
    await mongoose.connection.db.admin().ping();
    return Response.json({ status: "ok", db: "connected" });
  } catch (e) {
    return Response.json({ status: "error", message: "DB not reachable" }, { status: 500 });
  }
} 