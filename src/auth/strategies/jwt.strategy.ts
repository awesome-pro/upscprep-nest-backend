import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { UserStatus } from 'generated/prisma';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Extract from cookies first
        (request: Request) => {
          const cookies = request?.cookies;
          if (!cookies) {
            return null;
          }
          const token = cookies['accessToken'];
          return token;
        },
        // Fallback to Authorization header if cookie is not present
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      passReqToCallback: true,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET || 'Abhi123', // Using the same secret as in .env file
    });
  }

  async validate(request: Request, payload: JwtPayload) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        phoneNumber: true,
      },
    });

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
