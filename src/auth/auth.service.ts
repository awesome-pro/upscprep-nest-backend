import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './interfaces';
import { ConfigService } from '@nestjs/config';
import { User, UserRole, UserStatus } from '../../generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import { TokenResponseInternal } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name, phoneNumber, role } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phoneNumber,
        dateOfBirth: new Date(),
        role: role || UserRole.STUDENT,
        status: UserStatus.ACTIVE,
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
        walletBalance: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    const token = await this.generateTokens(user);

    return {
      user,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    };
  }

  /**
   * Authenticate a user and return a JWT token
   */
  // Login with email and password
  async login(user: Omit<User, 'password'>): Promise<TokenResponseInternal> {
    return await this.generateTokens(user);
  }

  // Refresh token
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseInternal> {
    const { refreshToken } = refreshTokenDto;

    // Find the refresh token in the database
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expires) {
      // Delete the expired token
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Delete the used refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id, token: refreshToken },
    });

    // Generate new tokens
    const { password, ...userWithoutPassword } = tokenRecord.user;
    return await this.generateTokens(userWithoutPassword);
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email },
    });

    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _, ...result } = user;
    return result;
  }

  /**
   * Generate JWT token for a user
   */
  // Generate access and refresh tokens
  private async generateTokens(
    user: Omit<User, 'password'>,
  ): Promise<TokenResponseInternal> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Access token expires in 30 minutes
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
      secret: process.env.JWT_ACCESS_TOKEN_SECRET || 'Abhi123', // Using the same secret as in .env file
    });

    // Refresh token expires in 7 days
    const refreshToken = uuidv4();
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 15);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expires: refreshTokenExpires,
        userId: user.id,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      user,
    };
  }

  /**
   * Hash a password
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   */
  async comparePasswords(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  /**
   * Verify a JWT token
   */
  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phoneNumber: true,
        dateOfBirth: true,
        enrollmentDate: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await this.comparePasswords(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async signOut(userId: string, refreshToken: string): Promise<boolean> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    return true;
  }

  // Sign out from all devices - invalidate all refresh tokens
  async signOutAll(userId: string): Promise<boolean> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });

    return true;
  }
}
