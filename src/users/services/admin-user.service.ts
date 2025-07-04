import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../dto';
import * as bcrypt from 'bcryptjs';
import {
  createPaginatedResponse,
  PaginatedResponse,
} from '../../util/pagination';

@Injectable()
export class AdminUserService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(query: UserQueryDto): Promise<PaginatedResponse<any>> {
    const {
      search,
      role,
      status,
      sortBy = 'enrollmentDate',
      sortOrder = 'desc',
      page = 1,
      pageSize = 10,
    } = query;
    const skip = (page - 1) * pageSize;

    // Build where conditions
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy || 'enrollmentDate'] = sortOrder || 'desc';

    // Get paginated users
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        role: true,
        walletBalance: true,
        _count: {
          select: {
            courseEnrollments: true,
            testSeriesEnrollments: true,
            attempts: true,
            createdCourses: true,
            createdExams: true,
            createdTestSeries: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy,
    });

    return createPaginatedResponse(users, total, pageSize, page);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        role: true,
        walletBalance: true,
        _count: {
          select: {
            courseEnrollments: true,
            testSeriesEnrollments: true,
            attempts: true,
            createdCourses: true,
            createdExams: true,
            createdTestSeries: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Create a new user
   */
  async createUser(createUserDto: CreateUserDto) {
    const { email, password, name, role, status, phoneNumber, dateOfBirth } =
      createUserDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        status,
        phoneNumber,
        dateOfBirth,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        role: true,
      },
    });

    return user;
  }

  /**
   * Update a user
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        status: true,
        role: true,
      },
    });

    return updatedUser;
  }

  /**
   * Reset user password
   */
  async resetPassword(id: string, newPassword: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    // Get user counts by role
    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    // Get user counts by status
    const usersByStatus = await this.prisma.user.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Get new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await this.prisma.user.count({
      where: {
        enrollmentDate: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get active users (with activity in the last 30 days)
    const activeUsers = await this.prisma.userProgress.groupBy({
      by: ['userId'],
      where: {
        lastAccessedAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: { userId: true },
    });

    // Format the statistics
    const roleStats = {};
    usersByRole.forEach((item) => {
      roleStats[item.role] = item._count.id;
    });

    const statusStats = {};
    usersByStatus.forEach((item) => {
      statusStats[item.status] = item._count.id;
    });

    return {
      totalUsers: await this.prisma.user.count(),
      byRole: roleStats,
      byStatus: statusStats,
      newUsersLast30Days: newUsers,
      activeUsersLast30Days: activeUsers.length,
    };
  }

  /**
   * Hash a password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
