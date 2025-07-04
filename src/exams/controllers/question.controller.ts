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
  Query,
} from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto, QueryQuestionDto, UpdateQuestionDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('questions')
@Controller('questions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  async create(@Request() req, @Body() createQuestionDto: CreateQuestionDto) {
    return await this.questionService.create(req.user.id, createQuestionDto);
  }

  @Post('bulk')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create multiple questions at once' })
  @ApiResponse({ status: 201, description: 'Questions created successfully' })
  async bulkCreate(
    @Request() req,
    @Body() createQuestionsDto: CreateQuestionDto[],
  ) {
    return await this.questionService.bulkCreate(
      req.user.id,
      createQuestionsDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated questions' })
  async findAll(@Query() queryDto: QueryQuestionDto) {
    return await this.questionService.findAll(queryDto);
  }

  @Get('exam/:examId')
  @ApiOperation({ summary: 'Get all questions for a specific exam' })
  @ApiResponse({ status: 200, description: 'Returns questions for the exam' })
  async findByExam(@Param('examId') examId: string) {
    return await this.questionService.findByExam(examId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiResponse({ status: 200, description: 'Returns the question' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async findOne(@Param('id') id: string) {
    return await this.questionService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return await this.questionService.update(
      id,
      req.user.id,
      updateQuestionDto,
    );
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async remove(@Request() req, @Param('id') id: string) {
    return await this.questionService.remove(id, req.user.id);
  }
}
