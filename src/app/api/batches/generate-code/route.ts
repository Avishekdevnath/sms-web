import { NextResponse } from "next/server";
import { generateNextBatchCode } from "@/lib/batchcode";

export async function GET() {
  try {
    const code = await generateNextBatchCode();
    
    return NextResponse.json({ code });
  } catch (error) {
    console.error('Error generating batch code:', error);
    return NextResponse.json(
      { error: 'Failed to generate batch code' },
      { status: 500 }
    );
  }
}
