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
import { StudentService } from '../services/student.service';
import { CreateStudentDto, UpdateStudentDto, UserQueryDto } from '../dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User, UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('profile')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getProfile(@CurrentUser() user: User) {
    return this.studentService.getStudentById(user.id);
  }

  @Get('enrollments')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getEnrollments(@CurrentUser() user: User) {
    return this.studentService.getStudentEnrollments(user.id);
  }

  @Get('progress')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getProgress(@CurrentUser() user: User) {
    return this.studentService.getStudentProgress(user.id);
  }

  @Patch('profile')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.updateStudent(user.id, updateStudentDto);
  }

  // Admin and teacher endpoints

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseGuards(RolesGuard)
  async getAllStudents(@Query() query: UserQueryDto) {
    return this.studentService.getAllStudents(query);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.createStudent(createStudentDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseGuards(RolesGuard)
  async getStudentById(@Param('id') id: string) {
    return this.studentService.getStudentById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateStudent(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.updateStudent(id, updateStudentDto);
  }

  @Get(':id/enrollments')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseGuards(RolesGuard)
  async getStudentEnrollments(@Param('id') id: string) {
    return this.studentService.getStudentEnrollments(id);
  }

  @Get(':id/progress')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @UseGuards(RolesGuard)
  async getStudentProgress(@Param('id') id: string) {
    return this.studentService.getStudentProgress(id);
  }
}
