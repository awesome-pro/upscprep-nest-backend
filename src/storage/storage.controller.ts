import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { FileExistsDto, FileUploadDto, ConfirmUploadDto } from './dto';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a presigned URL for direct upload to S3' })
  async getPresignedUrl(@Body() presignedUrlDto: PresignedUrlDto) {
    try {
      const { key, contentType, expiresIn } = presignedUrlDto;
      const uniqueKey = this.storageService.generateUniqueKey(
        key,
        presignedUrlDto.prefix,
      );

      return await this.storageService.getPresignedUploadUrl(
        uniqueKey,
        contentType,
        expiresIn,
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to generate presigned URL: ${error.message}`,
      );
    }
  }

  @Get('download/:key')
  @ApiOperation({ summary: 'Generate a presigned URL for downloading a file' })
  @ApiParam({ name: 'key', description: 'S3 object key' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    description: 'URL expiration time in seconds',
  })
  async getDownloadUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    try {
      const exists = await this.storageService.fileExists(key);
      if (!exists) {
        throw new NotFoundException(`File with key ${key} not found`);
      }

      return {
        url: await this.storageService.getPresignedDownloadUrl(key, expiresIn),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate download URL: ${error.message}`,
      );
    }
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to S3 through the server' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: FileUploadDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() fileUploadDto: FileUploadDto,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      const key = this.storageService.generateUniqueKey(
        file.originalname,
        fileUploadDto.prefix,
      );

      const result = await this.storageService.uploadFile(
        file.path,
        key,
        file.mimetype,
      );

      return {
        key,
        location: result.Location,
        eTag: result.ETag,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a file from S3' })
  @ApiParam({ name: 'key', description: 'S3 object key' })
  async deleteFile(@Param('key') key: string) {
    try {
      const exists = await this.storageService.fileExists(key);
      if (!exists) {
        throw new NotFoundException(`File with key ${key} not found`);
      }

      return await this.storageService.deleteFile(key);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  @Post('confirm-upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a file upload after direct upload to S3' })
  async confirmFileUpload(@Body() confirmUploadDto: ConfirmUploadDto) {
    try {
      const { key, etag } = confirmUploadDto;

      // Check if the file exists in S3
      const exists = await this.storageService.fileExists(key);
      if (!exists) {
        return {
          success: false,
          error: `File with key ${key} not found`,
        };
      }

      // Get file metadata
      const metadata = await this.storageService.getFileMetadata(key);

      // Generate a download URL
      const url = await this.storageService.getPresignedDownloadUrl(
        key,
        3600 * 24,
      ); // 24 hours

      return {
        success: true,
        fileInfo: {
          key,
          size: metadata.contentLength,
          etag: etag || metadata.eTag,
          contentType: metadata.contentType,
          url,
          metadata: metadata.metadata,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to confirm upload: ${error.message}`,
      };
    }
  }

  @Get('exists')
  @ApiOperation({ summary: 'Check if a file exists in S3' })
  async fileExists(@Body() fileExistsDto: FileExistsDto) {
    try {
      const exists = await this.storageService.fileExists(fileExistsDto.key);
      return { exists };
    } catch (error) {
      throw new BadRequestException(
        `Failed to check file existence: ${error.message}`,
      );
    }
  }

  @Get('metadata/:key')
  @ApiOperation({ summary: 'Get metadata for a file in S3' })
  @ApiParam({ name: 'key', description: 'S3 object key' })
  async getFileMetadata(@Param('key') key: string) {
    try {
      const exists = await this.storageService.fileExists(key);
      if (!exists) {
        throw new NotFoundException(`File with key ${key} not found`);
      }

      return await this.storageService.getFileMetadata(key);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get file metadata: ${error.message}`,
      );
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'List files in S3 with optional prefix' })
  @ApiQuery({
    name: 'prefix',
    required: false,
    description: 'Directory prefix',
  })
  @ApiQuery({
    name: 'maxKeys',
    required: false,
    description: 'Maximum number of keys to return',
  })
  async listFiles(
    @Query('prefix') prefix?: string,
    @Query('maxKeys') maxKeys?: number,
  ) {
    try {
      return {
        files: await this.storageService.listFiles(
          prefix,
          maxKeys ? Number(maxKeys) : undefined,
        ),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }
  }
}
