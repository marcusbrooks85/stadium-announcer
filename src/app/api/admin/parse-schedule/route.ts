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
      console.warn("⚠️ Validation Failed: Missing fileUrl or teamName");
      return NextResponse.json({ 
        error: 'Missing required parameters: fileUrl and teamName' 
      }, { status: 400 });
    }

    // 1. Fetch the file content from R2
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from R2: ${fileResponse.statusText} (${fileResponse.status})`);
    }

    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await fileResponse.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Convert to Base64 for Gemini Data URI format
    const base64Data = fileBuffer.toString('base64');
    const dataUri = `data:${contentType};base64,${base64Data}`;

    console.log(`✅ File Retrieved: Type=${contentType}, Size=${fileBuffer.length} bytes`);
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
      console.error("🔥 GEMINI API AI FLOW ERROR:", aiError);
      return NextResponse.json({ 
        error: `AI Parsing System Failure: ${aiError.message || 'The AI could not process this document format.'}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('🔥 GEMINI API ROUTE SYSTEM ERROR:', error);
    return NextResponse.json({ 
      error: `System Failure: ${error.message || "An unexpected error occurred during the parse request."}`
    }, { status: 500 });
  }
}
