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
      console.error("Workers AI Configuration Missing:", { accountId: !!accountId, aiToken: !!aiToken });
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

    // Llama 3.1 8b is a text-based model. We read the content as text for parsing.
    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('csv')) {
      fileContent = await fileResponse.text();
    } else {
      // Fallback for non-text formats if they are small enough to attempt reading
      console.warn(`File type ${contentType} detected. Cloudflare Llama 3.1 8b performs best with text/CSV.`);
      fileContent = await fileResponse.text();
    }

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
            { 
              role: "system", 
              content: "You are a schedule extraction tool. Parse the provided schedule text into a structured JSON array of game objects with properties: gameDate (YYYY-MM-DD), opponent, homeOrAway ('home' or 'away'), time, and location. Return ONLY valid JSON." 
            },
            { 
              role: "user", 
              content: `Extract the full game schedule for the team named "${teamName}" from the following text. Determine home/away status relative to "${teamName}".\n\nSCHEDULE TEXT:\n${fileContent}` 
            }
          ],
          response_format: { type: "json_object" }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`Workers AI Request Failed [${aiResponse.status}]:`, errorText);
      return NextResponse.json({ error: `Cloudflare AI Gateway returned ${aiResponse.status}` }, { status: aiResponse.status });
    }

    const result = await aiResponse.json();
    
    if (!result.success) {
      console.error("Cloudflare AI Execution Error:", result.errors);
      throw new Error(`Cloudflare AI Error: ${result.errors?.[0]?.message || 'Unknown error'}`);
    }

    // Cloudflare AI response structure puts text in result.response
    const aiText = result.result.response;
    try {
      // Attempt to sanitize potential markdown code blocks if the model included them despite instructions
      const cleanJson = aiText.replace(/```json\n?|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      // Ensure we return the expected structure even if the AI nested it
      if (parsedData.games) return NextResponse.json(parsedData);
      if (Array.isArray(parsedData)) return NextResponse.json({ games: parsedData });
      
      return NextResponse.json({ games: [] });
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON. Raw text:", aiText);
      throw new Error("AI returned a non-JSON response. Please ensure the file is text-based.");
    }

  } catch (error: any) {
    console.error('AI Parsing System Error:', error);
    return NextResponse.json({ 
      error: `AI Extraction Failed: ${error.message}`
    }, { status: 500 });
  }
}