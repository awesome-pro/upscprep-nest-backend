import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AnswerKeyService } from '../services';
import { CreateAnswerKeyDto, UpdateAnswerKeyDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UserRole } from 'generated/prisma';

@ApiTags('answer-keys')
@Controller('answer-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnswerKeyController {
  constructor(private readonly answerKeyService: AnswerKeyService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new answer key' })
  @ApiResponse({
    status: 201,
    description: 'Answer key created successfully',
  })
  async create(@Request() req, @Body() createAnswerKeyDto: CreateAnswerKeyDto) {
    return await this.answerKeyService.create(req.user.id, createAnswerKeyDto);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all answer keys' })
  @ApiResponse({
    status: 200,
    description: 'Return all answer keys',
  })
  async findAll() {
    return await this.answerKeyService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get an answer key by id' })
  @ApiParam({ name: 'id', description: 'Answer Key ID' })
  @ApiResponse({ status: 404, description: 'Answer key not found' })
  async findOne(@Param('id') id: string) {
    return await this.answerKeyService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an answer key' })
  @ApiParam({ name: 'id', description: 'Answer Key ID' })
  @ApiResponse({ status: 404, description: 'Answer key not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAnswerKeyDto: UpdateAnswerKeyDto,
  ) {
    return await this.answerKeyService.update(
      id,
      req.user.id,
      updateAnswerKeyDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an answer key' })
  @ApiParam({ name: 'id', description: 'Answer Key ID' })
  @ApiResponse({ status: 204, description: 'Answer key deleted successfully' })
  @ApiResponse({ status: 404, description: 'Answer key not found' })
  async remove(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    await this.answerKeyService.remove(id, req.user.id, isAdmin);
  }

  @Get('exam/:examId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all answer keys for a specific exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({
    status: 200,
    description: 'Return answer keys for the exam',
  })
  async getAnswerKeysByExam(@Param('examId') examId: string) {
    return await this.answerKeyService.getAnswerKeysByExam(examId);
  }

  @Get('exam/:examId/official')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get the official answer key for a specific exam' })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the official answer key',
  })
  @ApiResponse({ status: 404, description: 'Official answer key not found' })
  async getOfficialAnswerKey(@Param('examId') examId: string) {
    return await this.answerKeyService.getOfficialAnswerKey(examId);
  }
}
