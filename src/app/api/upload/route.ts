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

    let accountId, accessKeyId, secretAccessKey, bucketName;

    // Use hardcoded development credentials if env vars are missing
    if (process.env.NODE_ENV === 'development' || !process.env.R2_ACCOUNT_ID) {
      accountId = "66e24ae6da0ca15e881f10c5889a6783";
      accessKeyId = "7aa2e9b42b7c9981579bfa690a43a0e3";
      secretAccessKey = "37a9e9d11c0c4edadacd21ef99a232733d342fb586f747f0ccbe31bb7c26dab";
      bucketName = "on-deck-assets";
      console.log('R2 Proxy: Using hardcoded development credentials.');
    } else {
      accountId = process.env.R2_ACCOUNT_ID;
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      bucketName = process.env.R2_BUCKET_NAME;

      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        return NextResponse.json({ 
          error: 'Cloudflare R2 is not configured. Production requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.' 
        }, { status: 500 });
      }
    }

    // Harden Account ID: Strip protocol and trailing slashes
    const cleanAccountId = accountId.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Initialize S3 Client for Cloudflare R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${cleanAccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
    });

    // Generate unique key based on folder and timestamp
    const key = `${folder}/${Date.now()}_${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    /**
     * Perform the upload directly from the server.
     * This eliminates CORS issues between the browser and R2.
     */
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName.trim(),
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    // The public account identifier for R2 serving
    const publicId = "66e24ae6da0ca15e881f10c5889a6783";
    const url = `https://pub-${publicId}.r2.dev/${key}`;

    console.log("Successfully proxied upload to R2:", key);

    return NextResponse.json({ url, key });
  } catch (error: any) {
    console.error('R2 Proxy System Error:', error);
    return NextResponse.json({ 
      error: `Server-Side Upload Failure: ${error.message}`
    }, { status: 500 });
  }
}
