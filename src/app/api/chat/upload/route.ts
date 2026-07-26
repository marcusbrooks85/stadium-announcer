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

    let accountId, accessKeyId, secretAccessKey, bucketName;

    if (process.env.NODE_ENV === 'development') {
      accountId = "66e24ae6da0ca15e881f10c5889a6783";
      accessKeyId = "7aa2e9b42b7c9981579bfa690a43a0e3";
      secretAccessKey = "37a9e9d11c0c4edadacd21ef99a232733d342fb586f747f0ccbe31bb7c26dab";
      bucketName = "on-deck-assets";
    } else {
      accountId = process.env.R2_ACCOUNT_ID;
      accessKeyId = process.env.R2_ACCESS_KEY_ID;
      secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      bucketName = process.env.R2_BUCKET_NAME;

      if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
        return NextResponse.json({ error: 'R2 configuration missing' }, { status: 500 });
      }
    }

    const cleanAccountId = accountId.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${cleanAccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      },
    });

    const fileKey = `on-deck-assets/Chat-attachments/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName.trim(),
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    }));

    const publicId = "66e24ae6da0ca15e881f10c5889a6783";
    const url = `https://pub-${publicId}.r2.dev/${fileKey}`;

    return NextResponse.json({ url, fileKey });
  } catch (error: any) {
    console.error('Chat R2 Proxy Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
