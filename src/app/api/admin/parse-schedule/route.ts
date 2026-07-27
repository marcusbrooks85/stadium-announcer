import { NextRequest, NextResponse } from 'next/server';
import { runScheduleParser } from '@/ai/flows/parse-schedule-flow';

/**
 * API route to parse an uploaded schedule file using Google Gemini 1.5 Flash.
 * Fetches the file from R2 and processes it as a media part for Genkit.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileUrl, teamName } = body;

    console.log("--- ⚡ GEMINI SCHEDULE PARSE REQUEST START ---");
    console.log(`Target Team: "${teamName}"`);
    console.log(`Source URL: ${fileUrl}`);

    if (!fileUrl || !teamName) {
      console.error("🔥 GEMINI API ROUTE ERROR: Missing fileUrl or teamName");
      return NextResponse.json({ 
        error: 'Missing required parameters: fileUrl and teamName' 
      }, { status: 400 });
    }

    // 1. Fetch the file content from R2
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      const errorMsg = `Failed to fetch file from R2: ${fileResponse.statusText} (${fileResponse.status})`;
      console.error("🔥 R2 FETCH ERROR:", errorMsg);
      return NextResponse.json({ 
        error: errorMsg,
        details: "The server could not retrieve the file from storage for analysis."
      }, { status: 502 });
    }

    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    /**
     * Efficient Base64 Conversion for Gemini payload.
     * Hardening the binary transfer to ensure the AI model receives a clean Data URI.
     */
    const base64Data = fileBuffer.toString("base64");
    const dataUri = `data:${contentType};base64,${base64Data}`;

    // Force Terminal Logging as requested to identify silent failures
    console.log(`Starting Gemini parse for file type: ${contentType}, size: ${fileBuffer.length}`);

    // 2. Trigger Genkit Flow with Gemini 1.5 Flash
    try {
      const result = await runScheduleParser({
        fileDataUri: dataUri,
        teamName: teamName
      });

      console.log("--- ✅ GEMINI SCHEDULE PARSE SUCCESSFUL ---");
      console.log(`AI identified ${result.games?.length || 0} games for team "${teamName}".`);

      return NextResponse.json(result);
    } catch (aiError: any) {
      // Capture and log specific AI execution failures
      console.error("🔥 GEMINI AI FLOW ERROR:", aiError);
      return NextResponse.json({ 
        error: aiError.message || "AI model failed to process the document.",
        details: String(aiError)
      }, { status: 500 });
    }

  } catch (error: any) {
    // Force Terminal Logging for system or network failures
    console.error("🔥 GEMINI API ROUTE CRITICAL ERROR:", error);
    return NextResponse.json({ 
      error: error.message || "Internal Server Error",
      details: String(error)
    }, { status: 500 });
  }
}
