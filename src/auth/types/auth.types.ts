import { User } from 'generated/prisma';

export interface TokenResponseInternal {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<User, 'password'>;
}
