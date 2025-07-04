import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  s3: {
    region: process.env.AWS_REGION || 'eu-north-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'hellotrade-bucket',
    publicUrl: process.env.AWS_S3_PUBLIC_URL,
  },
  tempUploadsDir: process.env.TEMP_UPLOADS_DIR || './uploads/temp',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '20971520', 10), // 20MB
}));
