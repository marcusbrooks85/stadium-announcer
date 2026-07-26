import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * API route to generate a presigned PUT URL for Cloudflare R2.
 * Ensures strict header alignment and endpoint formatting.
 */
export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, folder = "schedule-uploads" } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
    }

    let accountId, accessKeyId, secretAccessKey, bucketName;

    // Use hardcoded development credentials if env vars are missing
    if (process.env.NODE_ENV === 'development' || !process.env.R2_ACCOUNT_ID) {
      accountId = "66e24ae6da0ca15e881f10c5889a6783";
      accessKeyId = "7aa2e9b42b7c9981579bfa690a43a0e3";
      secretAccessKey = "37a9e9d11c0c4edadacd21ef99a232733d342fb586f747f0ccbe31bb7c26dab";
      bucketName = "on-deck-assets";
    } else {
      accountId = process.env.R2_ACCOUNT_ID;
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      bucketName = process.env.R2_BUCKET_NAME;
    }

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return NextResponse.json({ error: 'R2 configuration is incomplete.' }, { status: 500 });
    }

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId.trim()}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
    });

    const key = `${folder}/${Date.now()}_${fileName}`;

    /**
     * CRITICAL: ContentType must be included in the command parameters
     * to match the signature with the actual 'Content-Type' header sent by the client.
     */
    const command = new PutObjectCommand({
      Bucket: bucketName.trim(),
      Key: key,
      ContentType: fileType,
    });

    // Generate pre-signed URL valid for 60 seconds
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return NextResponse.json({ uploadUrl, key });
  } catch (error: any) {
    console.error('R2 Presign System Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
