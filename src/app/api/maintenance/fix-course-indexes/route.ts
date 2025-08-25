import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Course } from "@/models/Course";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "developer"]);

  const collection = Course.collection;
  const indexes = await collection.indexes();
  let dropped = false;
  for (const idx of indexes) {
    if (idx.name === "code_1") {
      await collection.dropIndex("code_1");
      dropped = true;
      break;
    }
  }
  await collection.createIndex({ semesterId: 1, code: 1 }, { unique: true });
  return Response.json({ ok: true, droppedLegacyCodeIndex: dropped });
} 