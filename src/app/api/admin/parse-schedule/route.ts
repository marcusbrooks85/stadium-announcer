import { NextRequest, NextResponse } from 'next/server';

/**
 * API route to parse an uploaded schedule file using Cloudflare Workers AI.
 * Supports both text-based extraction (Llama 3.1) and image-based extraction (Llama 3.2 Vision).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileUrl, teamName } = body;

    // 1. Initial Diagnostic Logging
    console.log("--- SCHEDULE PARSE REQUEST START ---");
    console.log("Incoming Body:", { fileUrl, teamName });

    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || "").trim();
    const aiToken = (process.env.CLOUDFLARE_AI_TOKEN || "").trim();

    if (!accountId || !aiToken) {
      console.error("CRITICAL: Cloudflare AI configuration missing from process.env");
      return NextResponse.json({ 
        error: 'Cloudflare AI configuration is incomplete on the server.' 
      }, { status: 500 });
    }

    if (!fileUrl || !teamName) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileUrl and teamName' 
      }, { status: 400 });
    }

    // 2. Fetch the file content from R2
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from R2: ${fileResponse.statusText}`);
    }

    const contentType = fileResponse.headers.get('content-type') || '';
    const arrayBuffer = await fileResponse.arrayBuffer();
    const byteLength = arrayBuffer.byteLength;

    console.log(`File Metadata: Type="${contentType}", Size=${byteLength} bytes`);

    // 3. Determine Model and Prepare Payload
    const isImage = contentType.includes('image') || contentType.includes('pdf');
    let model = "@cf/meta/llama-3.1-8b-instruct";
    let payload: any = {};

    if (isImage) {
      console.log("Detected Image/Visual format. Routing to Llama 3.2 Vision...");
      model = "@cf/meta/llama-3.2-11b-vision-instruct";
      const base64Image = Buffer.from(arrayBuffer).toString('base64');
      
      payload = {
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Extract the full baseball game schedule for the team named "${teamName}" from this image. 
                Identify the exact Date (YYYY-MM-DD), Opponent, Home/Away status relative to "${teamName}", Time, and Location. 
                Return ONLY a JSON array of these objects. Do not include any other text.` 
              },
              { 
                type: "image", 
                image: base64Image 
              }
            ]
          }
        ]
      };
    } else {
      console.log("Detected Text-based format. Routing to Llama 3.1 Instruct...");
      const fileContent = new TextDecoder().decode(arrayBuffer);
      console.log("Human-Readable Content Snippet:", fileContent.substring(0, 200).replace(/\n/g, ' '));

      payload = {
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
      };
    }

    // 4. Call Cloudflare Workers AI
    console.log(`Dispatching AI Request to ${model}...`);
    const aiResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`Workers AI Request Failed [${aiResponse.status}]:`, errorText);
      return NextResponse.json({ 
        error: `Cloudflare AI Gateway error [${aiResponse.status}]: ${errorText}` 
      }, { status: 500 });
    }

    const result = await aiResponse.json();
    
    if (!result.success) {
      console.error("Cloudflare AI Execution Logic Error:", result.errors);
      throw new Error(`Cloudflare AI Logic Error: ${result.errors?.[0]?.message || 'Unknown execution error'}`);
    }

    // 5. Response Sanitization and Parsing
    const aiText = result.result.response;
    console.log("Raw AI Response Buffer:", aiText);

    try {
      // Clean markdown artifacts and parse
      const cleanJson = aiText.replace(/```json\n?|```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      
      console.log("--- SCHEDULE PARSE SUCCESSFUL ---");
      
      if (parsedData.games) return NextResponse.json(parsedData);
      if (Array.isArray(parsedData)) return NextResponse.json({ games: parsedData });
      if (parsedData.response && Array.isArray(parsedData.response)) return NextResponse.json({ games: parsedData.response });
      
      return NextResponse.json({ games: [] });
    } catch (parseError) {
      console.error("JSON Sanitization Failed. AI output was not a valid structure.", aiText);
      return NextResponse.json({ 
        error: "AI failed to return valid JSON. Please check the document format and try again." 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API System Runtime Error:', error);
    return NextResponse.json({ 
      error: `Parsing System Failure: ${error.message}`
    }, { status: 500 });
  }
}
