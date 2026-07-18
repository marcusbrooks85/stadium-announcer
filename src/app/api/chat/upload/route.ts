import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * API route to generate a presigned PUT URL for secure browser-based uploads to Cloudflare R2.
 * Includes a development-only bypass to handle environment isolation issues during local testing.
 */
export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    // Attempt to capture variables from the environment
    let accountId = process.env.R2_ACCOUNT_ID;
    let accessKeyId = process.env.R2_ACCESS_KEY_ID;
    let secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    let bucketName = process.env.R2_BUCKET_NAME;

    // Development Mode Bypass Logic
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      if (!accountId) accountId = "66e24ae6da0ca15e881f10c5889a6783";
      if (!accessKeyId) accessKeyId = "7aa2e9b42b7c9981579bfa690a43a0e3";
      if (!secretAccessKey) secretAccessKey = "37a9e9d11c0c4edadacd21ef99a232733d342fb586f747f0ccbe31bb7c26dab";
      if (!bucketName) bucketName = "on-deck-assets";
      
      console.log('R2 Upload: Running in development mode with fallback credentials active.');
    }

    // Strict validation (Always enforced in production)
    const missingKeys = [];
    if (!accountId) missingKeys.push('R2_ACCOUNT_ID');
    if (!accessKeyId) missingKeys.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missingKeys.push('R2_SECRET_ACCESS_KEY');
    if (!bucketName) missingKeys.push('R2_BUCKET_NAME');

    if (missingKeys.length > 0) {
      const errorMsg = `Cloudflare R2 is not configured. Missing: ${missingKeys.join(', ')}. Please ensure your production environment variables are set.`;
      console.error('CRITICAL ERROR:', errorMsg);
      
      return NextResponse.json({ 
        error: errorMsg 
      }, { status: 500 });
    }

    try {
      // Sanitize the account ID (trim spaces, ensure no protocol/slashes)
      const cleanAccountId = accountId.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

      const s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${cleanAccountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKeyId.trim()!,
          secretAccessKey: secretAccessKey.trim()!,
        },
      });

      // Destination key prefix exactly as requested
      const fileKey = `on-deck-assets/Chat-attachments/${Date.now()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: bucketName.trim(),
        Key: fileKey,
        ContentType: fileType,
      });

      // Generate pre-signed URL valid for 60 seconds
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

      return NextResponse.json({ uploadUrl, fileKey });
    } catch (s3Error: any) {
      console.error('R2 Signing System Error (AWS SDK):', s3Error);
      return NextResponse.json({ 
        error: `R2 SDK Failure: ${s3Error.message}`,
        details: s3Error.stack 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('R2 Presign Route Crash:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error during R2 presign' }, { status: 500 });
  }
}
