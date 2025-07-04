import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { AnswerService } from '../services/answer.service';
import { CreateAnswerDto, EvaluateAnswerDto, UpdateAnswerDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('answers')
@Controller('answers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Post()
  @ApiOperation({ summary: 'Submit an answer to a question' })
  @ApiResponse({ status: 201, description: 'Answer submitted successfully' })
  async create(@Request() req, @Body() createAnswerDto: CreateAnswerDto) {
    return await this.answerService.create(req.user.id, createAnswerDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an answer' })
  @ApiResponse({ status: 200, description: 'Answer updated successfully' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
  ) {
    return await this.answerService.update(id, req.user.id, updateAnswerDto);
  }

  @Get('attempt/:attemptId')
  @ApiOperation({ summary: 'Get all answers for a specific attempt' })
  @ApiResponse({ status: 200, description: 'Returns answers for the attempt' })
  async findByAttempt(@Param('attemptId') attemptId: string, @Request() req) {
    return await this.answerService.findByAttempt(attemptId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an answer by ID' })
  @ApiResponse({ status: 200, description: 'Returns the answer' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async findOne(@Param('id') id: string) {
    return await this.answerService.findOne(id);
  }

  @Post(':id/evaluate')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Evaluate an answer' })
  @ApiResponse({ status: 200, description: 'Answer evaluated successfully' })
  @ApiResponse({ status: 404, description: 'Answer not found' })
  async evaluate(
    @Request() req,
    @Param('id') id: string,
    @Body() evaluateAnswerDto: EvaluateAnswerDto,
  ) {
    return await this.answerService.evaluate(
      id,
      req.user.id,
      evaluateAnswerDto,
    );
  }

  @Post('bulk-evaluate/:attemptId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Bulk evaluate answers for an attempt' })
  @ApiResponse({ status: 200, description: 'Answers evaluated successfully' })
  async bulkEvaluate(
    @Request() req,
    @Param('attemptId') attemptId: string,
    @Body()
    evaluations: { questionId: string; marks: number; feedback?: string }[],
  ) {
    return await this.answerService.bulkEvaluate(
      attemptId,
      req.user.id,
      evaluations,
    );
  }
}
