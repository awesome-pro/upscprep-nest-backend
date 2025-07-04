import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminUserService } from '../services/admin-user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { RolesGuard } from 'src/auth/guards';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  async getAllUsers(@Query() query: UserQueryDto) {
    return this.adminUserService.getAllUsers(query);
  }

  @Get('statistics')
  async getUserStatistics() {
    return this.adminUserService.getUserStatistics();
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminUserService.createUser(createUserDto);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.adminUserService.getUserById(id);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminUserService.updateUser(id, updateUserDto);
  }

  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.adminUserService.resetPassword(id, body.password);
  }
}
