import { NextRequest, NextResponse } from 'next/server';
import { runScheduleParser } from '@/ai/flows/parse-schedule-flow';

/**
 * API route to parse an uploaded schedule file using Genkit AI.
 * Proxies the file buffer to the AI model for structured extraction.
 */
export async function POST(req: NextRequest) {
  try {
    const { fileUrl, teamName } = await req.json();

    if (!fileUrl || !teamName) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileUrl and teamName' 
      }, { status: 400 });
    }

    // Fetch the file from the R2 URL to convert to a data URI for Gemini
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Cloudflare R2 Access Failure: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const base64 = buffer.toString('base64');
    const fileDataUri = `data:${contentType};base64,${base64}`;

    console.log(`Starting AI Schedule Parse for team: ${teamName}`);
    const result = await runScheduleParser({ fileDataUri, teamName });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Parsing System Error:', error);
    return NextResponse.json({ 
      error: `AI Extraction Failed: ${error.message}`
    }, { status: 500 });
  }
}
