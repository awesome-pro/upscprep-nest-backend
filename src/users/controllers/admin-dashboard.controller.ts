import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminDashboardController {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly adminDashboardService: AdminDashboardService,
  ) {}

  @Get('users/statistics')
  async getUserStatistics() {
    const totalUsers = await this.adminDashboardService.countUsers();
    const usersByRole = await this.adminDashboardService.countUsersByRole();
    const newUsersLast30Days =
      await this.adminDashboardService.countNewUsersInLastDays(30);
    const activeUsersLast30Days =
      await this.adminDashboardService.countActiveUsersInLastDays(30);

    return {
      totalUsers,
      byRole: usersByRole,
      newUsersLast30Days,
      activeUsersLast30Days,
    };
  }

  @Get('users')
  async getUsers(
    @Query('pageSize') pageSize: string = '10',
    @Query('page') page: string = '1',
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: string = 'desc',
    @Query('role') role?: UserRole,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageSizeNum = parseInt(pageSize, 10);
    const pageNum = parseInt(page, 10);

    return this.adminDashboardService.findAll({
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: { [sortBy]: sortOrder.toLowerCase() },
      where: {
        ...(role && { role }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
    });
  }

  @Get('courses/statistics')
  async getCourseStatistics() {
    const totalCourses = await this.adminDashboardService.countCourses();
    const activeCourses = await this.adminDashboardService.countActiveCourses();
    const totalEnrollments =
      await this.adminDashboardService.countTotalEnrollments();
    const completionRate =
      await this.adminDashboardService.getAverageCompletionRate();

    return {
      totalCourses,
      activeCourses,
      totalEnrollments,
      completionRate,
    };
  }

  @Get('test-series/statistics')
  async getTestSeriesStatistics() {
    const totalTestSeries = await this.adminDashboardService.countTestSeries();
    const activeTestSeries =
      await this.adminDashboardService.countActiveTestSeries();
    const totalEnrollments =
      await this.adminDashboardService.countTestSeriesEnrollments();
    const totalAttempts = await this.adminDashboardService.countTotalAttempts();
    const averageScore = await this.adminDashboardService.getAverageScore();

    return {
      totalTestSeries,
      activeTestSeries,
      totalEnrollments,
      totalAttempts,
      averageScore,
    };
  }
}
