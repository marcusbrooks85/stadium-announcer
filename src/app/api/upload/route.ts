import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * API route to perform a Server-Side Proxy upload to Cloudflare R2.
 * Bypasses client-side CORS and extension blockers by handling the binary transfer on the server.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || "schedule-uploads";

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Explicit Environment Variable Mapping with Trimming and Sanitization
    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || "").trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
    const bucketName = (process.env.R2_BUCKET_NAME || "on-deck-assets").trim();

    // Explicit Error Reporting for Missing Keys
    if (!accountId || !accessKeyId || !secretAccessKey) {
      const missing = [];
      if (!accountId) missing.push("CLOUDFLARE_ACCOUNT_ID");
      if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
      if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
      
      console.error(`CRITICAL: R2 Configuration Missing: ${missing.join(', ')}`);
      return NextResponse.json({ 
        error: `R2 environment configuration is incomplete. Missing: ${missing.join(', ')}` 
      }, { status: 500 });
    }

    // Diagnostic Server-Side Logging
    console.log("R2 Proxy Diagnostic Check:");
    console.log(`- AccountId: ${accountId.length} chars, last 4: ...${accountId.slice(-4)}`);
    console.log(`- AccessKeyId: ${accessKeyId.length} chars, last 4: ...${accessKeyId.slice(-4)}`);
    console.log(`- Target Bucket: "${bucketName}"`);
    console.log(`- Target Folder: "${folder}/"`);

    // Initialize S3 Client for Cloudflare R2 with clean endpoint
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Generate unique key based on folder and timestamp
    const key = `${folder}/${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    /**
     * Perform the upload directly from the server.
     * This eliminates CORS issues and Signature mismatches caused by client-side headers.
     */
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    // The public account identifier for R2 serving
    const url = `https://pub-${accountId}.r2.dev/${key}`;

    console.log("Successfully proxied upload to R2:", key);

    return NextResponse.json({ url, key });
  } catch (error: any) {
    console.error('R2 Proxy System Error:', error);
    return NextResponse.json({ 
      error: `Server-Side Proxy Failure: ${error.message}`
    }, { status: 500 });
  }
}
