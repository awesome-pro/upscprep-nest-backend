import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user profile information
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        walletBalance: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  /**
   * Update user profile information
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Check if email is being updated and if it's already taken
    if (updateProfileDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateProfileDto.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already in use');
      }
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateProfileDto,
        dateOfBirth: updateProfileDto.dateOfBirth
          ? new Date(updateProfileDto.dateOfBirth)
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        walletBalance: true,
      },
    });

    return updatedUser;
  }
}
