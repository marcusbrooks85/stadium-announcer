import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to parse an uploaded schedule file using Cloudflare Workers AI.
 * Proxies the file content to Llama-3.1-8b-instruct for structured extraction.
 */
export async function POST(req: NextRequest) {
  try {
    const { fileUrl, teamName } = await req.json();

    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
    const aiToken = (process.env.CLOUDFLARE_AI_TOKEN || "").trim();

    if (!accountId || !aiToken) {
      return NextResponse.json({ 
        error: `Cloudflare AI configuration is incomplete. Missing: ${!accountId ? 'CLOUDFLARE_ACCOUNT_ID' : ''} ${!aiToken ? 'CLOUDFLARE_AI_TOKEN' : ''}` 
      }, { status: 500 });
    }

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

    const contentType = fileResponse.headers.get('content-type') || '';
    let fileContent = "";

    // For simplicity in this text-based Llama model, we treat the input as text.
    // If it's a binary format (like PDF/Image), Llama 3.1 8b (text-only) will struggle unless OCRed.
    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('csv')) {
      fileContent = await fileResponse.text();
    } else {
      // Fallback: If it's an image/pdf, we'd ideally need a vision model.
      // For now, we'll log a warning and try to read as much as possible.
      console.warn(`File type ${contentType} is not plain text. Cloudflare Llama 3.1 8b is text-only.`);
      fileContent = "Binary file content detected. Please ensure you upload a text-based schedule (CSV/TXT) for this specific AI model.";
      return NextResponse.json({ 
        error: 'The Cloudflare Llama 3.1 model requires text-based input (CSV, TXT, etc.). Please enter games manually or use a text-based file.',
        games: []
      });
    }

    const prompt = `
      You are a professional baseball league administrator.
      Extract a structured game schedule from the following text for the team: "${teamName}".
      
      RULES:
      - Only include games where "${teamName}" is a participant.
      - Output strictly valid JSON.
      - Date format: YYYY-MM-DD.
      - Time format: e.g., "6:00 PM".
      - homeOrAway must be "home" or "away" relative to "${teamName}".
      
      SCHEDULE TEXT:
      ${fileContent}
      
      Expected JSON Format:
      {
        "games": [
          {
            "gameDate": "2024-05-15",
            "opponent": "Opponent Team Name",
            "homeOrAway": "home",
            "time": "10:00 AM",
            "location": "Field Name",
            "notes": "Week 1"
          }
        ]
      }
    `;

    console.log(`Starting Cloudflare AI Parse for team: ${teamName}`);

    // 2. Call Cloudflare Workers AI
    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are a helpful assistant that outputs only JSON." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        }),
      }
    );

    const result = await aiResponse.json();
    console.log("Raw Cloudflare AI Response:", JSON.stringify(result));

    if (!result.success) {
      throw new Error(`Cloudflare AI Error: ${result.errors?.[0]?.message || 'Unknown error'}`);
    }

    // Cloudflare AI response structure puts text in result.response
    // We try to parse the text response into our expected JSON structure
    const aiText = result.result.response;
    try {
      const parsedData = JSON.parse(aiText);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      console.error("Failed to parse AI text as JSON:", aiText);
      throw new Error("AI returned a non-JSON response. Please try again or enter manually.");
    }

  } catch (error: any) {
    console.error('AI Parsing System Error:', error);
    return NextResponse.json({ 
      error: `AI Extraction Failed: ${error.message}`
    }, { status: 500 });
  }
}
