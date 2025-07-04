import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User, UserRole } from 'generated/prisma';
import { CurrentUser } from '../../auth/decorators';
import { ModuleService } from '../services/module.service';
import {
  CreateModuleDto,
  UpdateModuleDto,
  ModuleResponseDto,
  ModuleQueryParamsDto,
} from '../dto/module.dto';
import { PaginatedResponse } from '../../util/pagination';

@ApiTags('course-modules')
@Controller('courses/:courseId/modules')
@ApiBearerAuth()
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all modules for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Return all modules for a course',
    type: [ModuleResponseDto],
  })
  async findAll(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User,
  ): Promise<ModuleResponseDto[]> {
    return this.moduleService.findAll(courseId);
  }

  @Get('paginated')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get paginated modules for a course with search and filters',
  })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Return paginated modules for a course',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ModuleResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            pageSize: { type: 'number' },
            currentPage: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  async findAllPaginated(
    @Param('courseId') courseId: string,
    @Query() queryParams: ModuleQueryParamsDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedResponse<ModuleResponseDto>> {
    return this.moduleService.findAllPaginated(courseId, queryParams);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get module by id' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({
    status: 200,
    description: 'Return module by id',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async findOne(@Param('id') id: string): Promise<ModuleResponseDto> {
    return this.moduleService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new module for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Module created successfully',
    type: ModuleResponseDto,
  })
  async create(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ): Promise<ModuleResponseDto> {
    return this.moduleService.create(courseId, createModuleDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a module' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Module updated successfully',
    type: ModuleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async update(
    @Param('id') id: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ): Promise<ModuleResponseDto> {
    return this.moduleService.update(id, updateModuleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a module' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'id', description: 'Module ID' })
  @ApiResponse({ status: 204, description: 'Module deleted successfully' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.moduleService.remove(id);
  }
}
