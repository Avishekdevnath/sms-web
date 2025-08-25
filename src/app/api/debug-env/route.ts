import { NextRequest } from "next/server";
import { JWT_SECRET } from "@/lib/env";

export async function GET(req: NextRequest) {
  try {
    return Response.json({
      success: true,
      jwtSecretLength: JWT_SECRET.length,
      jwtSecretConfigured: JWT_SECRET.length > 10,
      jwtSecretPreview: JWT_SECRET.substring(0, 10) + '...'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
