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

    // Explicit Environment Variable Mapping with Trimming
    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || "").trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const accessKeyId = (process.env.R2_ACCESS_KEY_ID || "").trim();
    const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || "").trim();
    const bucketName = (process.env.R2_BUCKET_NAME || "on-deck-assets").trim();

    // Diagnostic Server-Side Logging
    console.log("R2 Proxy Diagnostic Check:");
    console.log(`- AccountId Length: ${accountId.length}, Last 4: ...${accountId.slice(-4)}`);
    console.log(`- AccessKeyId Length: ${accessKeyId.length}, Last 4: ...${accessKeyId.slice(-4)}`);
    console.log(`- SecretKey Length: ${secretAccessKey.length}`);
    console.log(`- Target Bucket: "${bucketName}"`);
    console.log(`- Target Folder: "${folder}"`);

    if (!accountId || !accessKeyId || !secretAccessKey) {
      console.error("CRITICAL: R2 Configuration Missing in Environment Variables.");
      return NextResponse.json({ 
        error: 'R2 environment configuration is incomplete.' 
      }, { status: 500 });
    }

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
    // Note: We use the accountId for the endpoint, but serving usually happens via a public domain or pub-<id>.r2.dev
    const publicId = accountId; 
    const url = `https://pub-${publicId}.r2.dev/${key}`;

    console.log("Successfully proxied upload to R2:", key);

    return NextResponse.json({ url, key });
  } catch (error: any) {
    console.error('R2 Proxy System Error:', error);
    return NextResponse.json({ 
      error: `Server-Side Proxy Failure: ${error.message}`
    }, { status: 500 });
  }
}
