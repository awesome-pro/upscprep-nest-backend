import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpStatus,
  HttpCode,
  ForbiddenException,
} from '@nestjs/common';
import { AttemptService } from '../services';
import { CreateAttemptDto, UpdateAttemptDto, QueryAttemptDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

@ApiTags('attempts')
@Controller('attempts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttemptController {
  constructor(private readonly attemptService: AttemptService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new attempt for an exam' })
  @ApiResponse({
    status: 201,
    description: 'Attempt created successfully',
  })
  async create(@Request() req, @Body() createAttemptDto: CreateAttemptDto) {
    return await this.attemptService.create(req.user.id, createAttemptDto);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all attempts with pagination and filtering (admin/teacher only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all attempts',
  })
  async findAll(@Query() queryDto: QueryAttemptDto) {
    return await this.attemptService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an attempt by id' })
  @ApiParam({ name: 'id', description: 'Attempt ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the attempt',
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async findOne(@Param('id') id: string) {
    return await this.attemptService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an attempt' })
  @ApiParam({ name: 'id', description: 'Attempt ID' })
  @ApiResponse({
    status: 200,
    description: 'Attempt updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAttemptDto: UpdateAttemptDto,
  ) {
    const isTeacher =
      req.user.role === UserRole.TEACHER || req.user.role === UserRole.ADMIN;
    return await this.attemptService.update(
      id,
      req.user.id,
      updateAttemptDto,
      isTeacher,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attempt' })
  @ApiParam({ name: 'id', description: 'Attempt ID' })
  @ApiResponse({ status: 204, description: 'Attempt deleted successfully' })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async remove(@Request() req, @Param('id') id: string) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    await this.attemptService.remove(id, req.user.id, isAdmin);
  }

  @Get('user/my-attempts')
  @ApiOperation({ summary: 'Get all attempts by the logged-in user' })
  @ApiResponse({
    status: 200,
    description: "Return user's attempts",
  })
  async getMyAttempts(@Request() req, @Query() queryDto: QueryAttemptDto) {
    return await this.attemptService.getAttemptsByUser(req.user.id, queryDto);
  }

  @Get('exam/:examId')
  @ApiOperation({
    summary: 'Get all attempts for a specific exam (admin/teacher only)',
  })
  @ApiParam({ name: 'examId', description: 'Exam ID' })
  @ApiResponse({
    status: 200,
    description: 'Return attempts for the exam',
  })
  async getAttemptsByExam(
    @Param('examId') examId: string,
    @Query() queryDto: QueryAttemptDto,
  ) {
    return await this.attemptService.getAttemptsByExam(examId, queryDto);
  }

  @Get('evaluator/my-evaluations')
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary:
      'Get all attempts assigned to the logged-in teacher for evaluation',
  })
  @ApiResponse({
    status: 200,
    description: "Return teacher's assigned attempts",
  })
  async getMyEvaluations(@Request() req, @Query() queryDto: QueryAttemptDto) {
    return await this.attemptService.getAttemptsByEvaluator(
      req.user.id,
      queryDto,
    );
  }

  @Post(':id/assign/:evaluatorId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assign an attempt to a teacher for evaluation (admin only)',
  })
  @ApiParam({ name: 'id', description: 'Attempt ID' })
  @ApiParam({ name: 'evaluatorId', description: 'Evaluator (Teacher) ID' })
  @ApiResponse({
    status: 201,
    description: 'Attempt assigned successfully',
  })
  async assignAttemptToEvaluator(
    @Request() req,
    @Param('id') id: string,
    @Param('evaluatorId') evaluatorId: string,
  ) {
    return await this.attemptService.assignAttemptToEvaluator(
      id,
      evaluatorId,
      req.user.id,
    );
  }
}
