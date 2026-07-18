import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * API route to generate a presigned PUT URL for secure browser-based uploads to Cloudflare R2.
 * Strictly enforced: No Firebase fallback, strict environment validation with detailed logging.
 */
export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    // Capture variables
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    // Build list of missing keys for debugging
    const missingKeys = [];
    if (!accountId) missingKeys.push('R2_ACCOUNT_ID');
    if (!accessKeyId) missingKeys.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missingKeys.push('R2_SECRET_ACCESS_KEY');
    if (!bucketName) missingKeys.push('R2_BUCKET_NAME');

    if (missingKeys.length > 0) {
      console.error('CRITICAL: Cloudflare R2 Configuration is incomplete.');
      console.error('The following environment variables are MISSING from the current process:', missingKeys.join(', '));
      console.error('Check your .env.local file in the project root and restart the dev server.');
      
      return NextResponse.json({ 
        error: `Cloudflare R2 is not configured. Missing: ${missingKeys.join(', ')}. Uploads are strictly restricted to R2.` 
      }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });

    // Force destination key prefix exactly as requested
    const fileKey = `on-deck-assets/Chat-attachments/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate pre-signed URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error: any) {
    console.error('R2 Presign System Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error during R2 presign' }, { status: 500 });
  }
}
