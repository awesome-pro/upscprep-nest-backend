import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fsPromises } from 'fs';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('storage.s3.region'),
    });
    this.bucketName = this.configService.get<string>('storage.s3.bucketName')!;
  }

  /**
   * Upload a file to S3 from a local path
   * @param filePath Local file path
   * @param key S3 object key
   * @param contentType MIME type of the file
   * @returns Object with ETag and Location
   */
  async uploadFile(
    filePath: string,
    key: string,
    contentType: string,
  ): Promise<{ ETag: string; Location: string }> {
    try {
      const fileBuffer = await fsPromises.readFile(filePath);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        },
      });

      const result = await upload.done();

      this.logger.log(`File uploaded successfully: ${key}`);
      return {
        ETag: result.ETag as string,
        Location: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      this.logger.error(
        `Error uploading file to S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Upload a buffer to S3
   * @param buffer File buffer
   * @param key S3 object key
   * @param contentType MIME type of the file
   * @returns Object with ETag and Location
   */
  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<{ ETag: string; Location: string }> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        },
      });

      const result = await upload.done();

      this.logger.log(`Buffer uploaded successfully: ${key}`);
      return {
        ETag: result.ETag as string,
        Location: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
      };
    } catch (error) {
      this.logger.error(
        `Error uploading buffer to S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param key S3 object key
   * @returns Success status
   */
  async deleteFile(key: string): Promise<{ success: boolean }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error deleting file from S3: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Check if a file exists in S3
   * @param key S3 object key
   * @returns Boolean indicating if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof S3ServiceException && error.name === 'NotFound') {
        return false;
      }
      this.logger.error(
        `Error checking if file exists: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   * @param key S3 object key
   * @returns File metadata
   */
  async getFileMetadata(key: string): Promise<Record<string, any>> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        eTag: response.ETag,
        metadata: response.Metadata,
      };
    } catch (error) {
      this.logger.error(
        `Error getting file metadata: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a presigned URL for uploading a file directly from the client
   * @param key S3 object key
   * @param contentType MIME type of the file
   * @param expiresIn URL expiration time in seconds (default: 3600)
   * @returns Presigned URL for PUT operation
   */
  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
  ): Promise<{ url: string; key: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(`Generated presigned upload URL for: ${key}`);
      return { url, key };
    } catch (error) {
      this.logger.error(
        `Error generating presigned upload URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a presigned URL for downloading a file
   * @param key S3 object key
   * @param expiresIn URL expiration time in seconds (default: 3600)
   * @returns Presigned URL for GET operation
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      this.logger.log(`Generated presigned download URL for: ${key}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Error generating presigned download URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * List files in a directory (prefix) in S3
   * @param prefix Directory prefix
   * @param maxKeys Maximum number of keys to return
   * @returns List of objects
   */
  async listFiles(prefix = '', maxKeys = 1000): Promise<any[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);

      return (
        response.Contents?.map((item) => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          eTag: item.ETag,
        })) || []
      );
    } catch (error) {
      this.logger.error(`Error listing files: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Download a file from S3 to a local path
   * @param key S3 object key
   * @param destinationPath Local destination path
   * @returns Success status
   */
  async downloadFile(
    key: string,
    destinationPath: string,
  ): Promise<{ success: boolean }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Ensure the directory exists
      const directory = destinationPath.substring(
        0,
        destinationPath.lastIndexOf('/'),
      );
      await fsPromises.mkdir(directory, { recursive: true });

      // Write the file
      const body = await response?.Body?.transformToByteArray();
      await fsPromises.writeFile(destinationPath, Buffer.from(body as any));

      this.logger.log(`File downloaded successfully to: ${destinationPath}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error downloading file: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a readable stream for a file from S3
   * @param key S3 object key
   * @returns Readable stream
   */
  async getFileStream(key: string): Promise<ReadableStream> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return response.Body as ReadableStream;
    } catch (error) {
      this.logger.error(
        `Error getting file stream: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get a file from S3 as a Buffer
   * @param key S3 object key
   * @returns Buffer containing the file contents
   */
  async getFileBuffer(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      // Convert the response body to a buffer
      const bodyContents = await response.Body?.transformToByteArray();
      return Buffer.from(bodyContents as any);
    } catch (error) {
      this.logger.error(
        `Error getting file as buffer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a unique key for S3 based on file name and timestamp
   * @param fileName Original file name
   * @param prefix Optional prefix/folder
   * @returns Unique S3 key
   */
  generateUniqueKey(fileName: string, prefix = ''): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return prefix
      ? `${prefix.replace(/\/$/, '')}/${timestamp}-${sanitizedFileName}`
      : `${timestamp}-${sanitizedFileName}`;
  }
}
