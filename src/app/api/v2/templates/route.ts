import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Template } from "@/models";
import { getAuthUserFromRequest } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');
    const key = searchParams.get('key');
    const filter: any = {};
    if (scope) filter.scope = scope;
    if (key) filter.key = key;
    const docs = await Template.find(filter).sort({ key: 1, scope: 1, version: -1 }).lean();
    return Response.json({ success: true, data: docs });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (me.role === 'student') return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const doc = await Template.create({ ...body, createdBy: me._id });
    return Response.json({ success: true, data: doc });
  } catch (e: any) {
    return Response.json({ success: false, error: e?.message || 'Failed' }, { status: 500 });
  }
}


