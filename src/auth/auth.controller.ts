import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenDto, RegisterDto } from './dto';
import { LocalAuthGuard, JwtAuthGuard } from './guards';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from 'generated/prisma';
import type { Request, Response } from 'express';
import { Public } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Set HTTP-only cookies for tokens
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days in milliseconds
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    return { user: result.user };
  }

  @Public()
  @Post('sign-in')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentUser() user: Omit<User, 'password'>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(user);

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000,
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    return result.user;
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = refreshTokenDto.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Cast the result to TokenResponseInternal to access the tokens
    const result = await this.authService.refreshToken(refreshTokenDto);

    // Set HTTP-only cookies for tokens
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 15 * 24 * 60 * 60 * 1000,
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    // Return only the user data (TokenResponse)
    return { user: result.user, expiresIn: result.expiresIn };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  verifyToken(@CurrentUser() user: User) {
    return {
      isValid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  async signOut(
    @CurrentUser() user: Omit<User, 'password'>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract refresh token from cookies
    const refreshToken = req.cookies['refreshToken'];

    // Sign out using the token from cookies
    await this.authService.signOut(user.id, refreshToken);

    // Clear cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain:
        process.env.NODE_ENV === 'production' ? '.cynosnexus.com' : undefined,
    });

    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }
}
