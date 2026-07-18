import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * API route to generate a presigned PUT URL for secure browser-based uploads to Cloudflare R2.
 */
export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    // Validate Environment Variables
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error('R2 Config Missing:', { accountId: !!accountId, accessKeyId: !!accessKeyId, secretAccessKey: !!secretAccessKey, bucketName: !!bucketName });
      return NextResponse.json({ 
        error: 'Cloudflare R2 is not configured. Please check your environment variables (R2_ACCOUNT_ID, etc).' 
      }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    // Force destination key prefix as requested
    const fileKey = `on-deck-assets/Chat-attachments/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    // Generate pre-signed URL
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error: any) {
    console.error('R2 Presign Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error during presign' }, { status: 500 });
  }
}
