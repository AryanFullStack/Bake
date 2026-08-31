import { NextResponse } from "next/server";

// Composio is stopped/disabled for this project.
// Return a clean 200 response to prevent external polling tools from generating 404/500 log spam.
export async function GET() {
  return NextResponse.json({
    status: "disabled",
    message: "Composio integration is disabled in this project.",
  });
}
