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
import { TeacherService } from '../services/teacher.service';
import {
  CreateTeacherDto,
  TeacherStudentsQueryDto,
  UpdateTeacherDto,
  UserQueryDto,
} from '../dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User, UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('profile')
  @Roles(UserRole.TEACHER)
  async getProfile(@CurrentUser() user: User) {
    return this.teacherService.getTeacherById(user.id);
  }

  @Get('content')
  @Roles(UserRole.TEACHER)
  async getContent(@CurrentUser() user: User) {
    return this.teacherService.getTeacherContent(user.id);
  }

  @Get('students')
  @Roles(UserRole.TEACHER)
  async getStudents(
    @CurrentUser() user: User,
    @Query() query: TeacherStudentsQueryDto,
  ) {
    return this.teacherService.getTeacherStudents(user.id, query);
  }

  @Patch('profile')
  @Roles(UserRole.TEACHER)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teacherService.updateTeacher(user.id, updateTeacherDto);
  }

  // Admin endpoints

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllTeachers(@Query() query: UserQueryDto) {
    return this.teacherService.getAllTeachers(query);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async createTeacher(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.createTeacher(createTeacherDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async getTeacherById(@Param('id') id: string) {
    return this.teacherService.getTeacherById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async updateTeacher(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teacherService.updateTeacher(id, updateTeacherDto);
  }

  @Get(':id/content')
  @Roles(UserRole.TEACHER)
  async getTeacherContent(@Param('id') id: string) {
    return this.teacherService.getTeacherContent(id);
  }

  @Get(':id/students')
  @Roles(UserRole.TEACHER)
  async getTeacherStudents(
    @Param('id') id: string,
    @Query() query: TeacherStudentsQueryDto,
  ) {
    return this.teacherService.getTeacherStudents(id, query);
  }
}
