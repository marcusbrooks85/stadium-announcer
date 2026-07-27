import { NextRequest, NextResponse } from 'next/server';
import { runScheduleParser } from '@/ai/flows/parse-schedule-flow';

/**
 * API route to parse an uploaded schedule file using Google Gemini 1.5 Flash.
 * Optimized to handle both JSON (R2 URL) and Multipart (Direct File) to bypass 401 errors.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let fileBuffer: Buffer;
    let teamName: string;
    let mimeType: string;

    console.log("--- ⚡ GEMINI SCHEDULE PARSE REQUEST START ---");

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      teamName = (formData.get('teamName') as string) || '';
      
      console.log(`Direct Binary Mode. Target Team: "${teamName}"`);

      if (!file || !teamName) {
        console.error("🔥 PARSE ERROR: Missing file or teamName in form data");
        return NextResponse.json({ 
          error: 'Missing required parameters: file and teamName' 
        }, { status: 400 });
      }

      mimeType = file.type || 'application/octet-stream';
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // Legacy JSON Mode (Fetch from R2 - prone to 401s on dev domains)
      const body = await req.json();
      const { fileUrl, teamName: bodyTeamName } = body;
      teamName = bodyTeamName;

      console.log(`URL Fetch Mode. Target Team: "${teamName}"`);

      if (!fileUrl || !teamName) {
        return NextResponse.json({ 
          error: 'Missing required parameters: fileUrl and teamName' 
        }, { status: 400 });
      }

      // Fetch file content from R2
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        const errorMsg = `Failed to fetch file from storage: ${fileResponse.statusText} (${fileResponse.status})`;
        console.error("🔥 STORAGE FETCH ERROR:", errorMsg);
        return NextResponse.json({ 
          error: errorMsg,
          details: "The server could not retrieve the file from storage. Try uploading the file again."
        }, { status: 502 });
      }

      mimeType = fileResponse.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await fileResponse.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }
    
    /**
     * Efficient Base64 Conversion for Gemini payload.
     */
    const base64Data = fileBuffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    console.log(`Starting Gemini parse for file type: ${mimeType}, size: ${fileBuffer.length} bytes`);

    // Trigger Genkit Flow with Gemini 1.5 Flash
    try {
      const result = await runScheduleParser({
        fileDataUri: dataUri,
        teamName: teamName
      });

      console.log("--- ✅ GEMINI SCHEDULE PARSE SUCCESSFUL ---");
      console.log(`AI identified ${result.games?.length || 0} games for team "${teamName}".`);

      return NextResponse.json(result);
    } catch (aiError: any) {
      console.error("🔥 GEMINI AI FLOW ERROR:", aiError);
      return NextResponse.json({ 
        error: aiError.message || "AI model failed to process the document.",
        details: String(aiError)
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("🔥 GEMINI API ROUTE CRITICAL ERROR:", error);
    return NextResponse.json({ 
      error: error.message || "Internal Server Error",
      details: String(error)
    }, { status: 500 });
  }
}
