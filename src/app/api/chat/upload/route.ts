import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * API route to generate a presigned PUT URL for secure browser-based uploads to Cloudflare R2.
 * Strictly uses R2 with mandatory Content-Type signature matching.
 */
export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    let accountId, accessKeyId, secretAccessKey, bucketName;

    // Environment Variable Logic: Use hardcoded strings for development (Emulator bypass)
    // and strictly enforce process.env for production.
    if (process.env.NODE_ENV === 'development') {
      accountId = "66e24ae6da0ca15e881f10c5889a6783";
      accessKeyId = "7aa2e9b42b7c9981579bfa690a43a0e3";
      secretAccessKey = "37a9e9d11c0c4edadacd21ef99a232733d342fb586f747f0ccbe31bb7c26dab";
      bucketName = "on-deck-assets";
      console.log('R2 Upload: Using hardcoded development credentials.');
    } else {
      accountId = process.env.R2_ACCOUNT_ID;
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      bucketName = process.env.R2_BUCKET_NAME;

      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        console.error('CRITICAL: Cloudflare R2 environment variables are missing in production.');
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
      forcePathStyle: true, // Required for certain R2 configurations to ensure correct pathing
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
    });

    // Target path inside the bucket
    const fileKey = `on-deck-assets/Chat-attachments/${Date.now()}-${fileName}`;

    /**
     * CRITICAL: ContentType MUST be included in the command parameters
     * to match the binary 'Content-Type' header sent by the client.
     */
    const command = new PutObjectCommand({
      Bucket: bucketName.trim(),
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate pre-signed URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // Diagnostic log for the server terminal
    console.log("GENERATED PRESIGNED URL:", uploadUrl);

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error: any) {
    console.error('R2 Presign System Error:', error);
    return NextResponse.json({ 
      error: `R2 SDK Failure: ${error.message}`
    }, { status: 500 });
  }
}
