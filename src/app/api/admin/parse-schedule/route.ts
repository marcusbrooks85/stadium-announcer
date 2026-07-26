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

    console.log("--- GEMINI SCHEDULE PARSE REQUEST START ---");
    console.log("Processing schedule for team:", teamName);

    if (!fileUrl || !teamName) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileUrl and teamName' 
      }, { status: 400 });
    }

    // 1. Fetch the file content from R2
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from R2: ${fileResponse.statusText}`);
    }

    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64Content}`;

    console.log(`Processing schedule with Gemini 1.5 Flash. File type: ${contentType}, Size: ${arrayBuffer.byteLength} bytes`);

    // 2. Trigger Genkit Flow with Gemini 1.5 Flash
    try {
      const result = await runScheduleParser({
        fileDataUri: dataUri,
        teamName: teamName
      });

      console.log("--- GEMINI SCHEDULE PARSE SUCCESSFUL ---");
      console.log(`AI identified ${result.games?.length || 0} games.`);

      return NextResponse.json(result);
    } catch (aiError: any) {
      console.error("Gemini Parsing Error:", aiError);
      return NextResponse.json({ 
        error: `AI Parsing System Failure: ${aiError.message || 'The AI could not process this document format.'}`
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API System Runtime Error:', error);
    return NextResponse.json({ 
      error: `System Failure: ${error.message}`
    }, { status: 500 });
  }
}
