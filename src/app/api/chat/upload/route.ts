import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * API route for secure server-side proxied chat attachment uploads to Cloudflare R2.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

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
      
      console.error(`CRITICAL: Chat R2 Configuration Missing: ${missing.join(', ')}`);
      return NextResponse.json({ 
        error: `Chat R2 environment configuration is incomplete. Missing: ${missing.join(', ')}` 
      }, { status: 500 });
    }

    // Diagnostic Server-Side Logging
    console.log("Chat R2 Proxy Diagnostic Check:");
    console.log(`- AccountId: ${accountId.length} chars, last 4: ...${accountId.slice(-4)}`);
    console.log(`- AccessKeyId: ${accessKeyId.length} chars, last 4: ...${accessKeyId.slice(-4)}`);
    console.log(`- Target Bucket: "${bucketName}"`);

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileKey = `Chat-attachments/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    }));

    const url = `https://pub-${accountId}.r2.dev/${fileKey}`;

    return NextResponse.json({ url, fileKey });
  } catch (error: any) {
    console.error('Chat R2 Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
