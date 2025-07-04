import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { TestSeriesService } from './test-series.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExamType, User } from 'generated/prisma';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TestSeriesListDto, TestSeriesDetailDto } from './dto/test-series.dto';
import { CurrentUser } from 'src/auth/decorators';

@ApiTags('test-series')
@Controller('test-series')
export class TestSeriesController {
  constructor(private readonly testSeriesService: TestSeriesService) {}

  // @Get()
  // @UseGuards(JwtAuthGuard)
  // @ApiOperation({ summary: 'Get all test series' })
  // @ApiQuery({ name: 'type', enum: ExamType, required: false })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Return all test series',
  //   type: [TestSeriesListDto],
  // })
  // async findAll(
  //   @CurrentUser() user: User,
  //   @Query('type') type?: ExamType,
  // ): Promise<TestSeriesListDto[]> {
  //   const userId = user.id;

  //   if (type) {
  //     return this.testSeriesService.findByType(type, userId);
  //   }

  //   return this.testSeriesService.findAll(userId);
  // }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get test series by id' })
  @ApiParam({ name: 'id', description: 'Test Series ID' })
  @ApiResponse({
    status: 200,
    description: 'Return test series by id',
    type: TestSeriesDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Test series not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<TestSeriesDetailDto> {
    const userId = user.id;
    return this.testSeriesService.findOne(id, userId);
  }

  @Get(':id/access')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if user has access to a test series' })
  @ApiParam({ name: 'id', description: 'Test Series ID' })
  @ApiResponse({ status: 200, description: 'Return access status' })
  @ApiResponse({ status: 404, description: 'Test series not found' })
  async checkAccess(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ hasAccess: boolean }> {
    const userId = user.id;
    const hasAccess = await this.testSeriesService.checkUserAccess(userId, id);
    return { hasAccess };
  }
}
