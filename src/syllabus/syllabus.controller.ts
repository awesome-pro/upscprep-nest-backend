// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   UseGuards,
//   Query,
//   HttpCode,
//   HttpStatus,
//   ForbiddenException,
// } from '@nestjs/common';
// import { SyllabusService } from './syllabus.service';
// import { CreateSyllabusDto, UpdateSyllabusDto, QuerySyllabusDto } from './dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { User, UserRole } from '../../generated/prisma';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { PaginatedResponse } from '../util/pagination';

// @Controller('syllabus')
// @UseGuards(JwtAuthGuard)
// export class SyllabusController {
//   constructor(private readonly syllabusService: SyllabusService) {}

//   @Post()
//   @UseGuards(RolesGuard)
//   @Roles(UserRole.TEACHER, UserRole.ADMIN)
//   @HttpCode(HttpStatus.CREATED)
//   create(
//     @Body() createSyllabusDto: CreateSyllabusDto,
//     @CurrentUser() user: User,
//   ) {
//     return this.syllabusService.create(createSyllabusDto, user.id);
//   }

//   @Get()
//   @HttpCode(HttpStatus.OK)
//   findAll(@Query() query: QuerySyllabusDto) {
//     return this.syllabusService.findAll(query);
//   }

//   @Get('search')
//   @HttpCode(HttpStatus.OK)
//   search(
//     @Query('term') searchTerm: string,
//     @Query('page') page?: number,
//     @Query('pageSize') pageSize?: number,
//   ) {
//     return this.syllabusService.search(searchTerm, page, pageSize);
//   }

//   @Get('teacher')
//   @UseGuards(RolesGuard)
//   @Roles(UserRole.TEACHER, UserRole.ADMIN)
//   @HttpCode(HttpStatus.OK)
//   findByTeacher(@CurrentUser() user: User, @Query() query: QuerySyllabusDto) {
//     return this.syllabusService.findByTeacher(user.id, query);
//   }

//   @Get(':id')
//   @HttpCode(HttpStatus.OK)
//   findOne(@Param('id') id: string) {
//     return this.syllabusService.findOne(id);
//   }

//   @Patch(':id')
//   @HttpCode(HttpStatus.OK)
//   update(
//     @Param('id') id: string,
//     @Body() updateSyllabusDto: UpdateSyllabusDto,
//     @CurrentUser() user: User,
//   ) {
//     return this.syllabusService.update(
//       id,
//       updateSyllabusDto,
//       user.id,
//       user.role,
//     );
//   }

//   @Delete(':id')
//   @HttpCode(HttpStatus.NO_CONTENT)
//   remove(@Param('id') id: string, @CurrentUser() user: User) {
//     return this.syllabusService.remove(id, user.id, user.role);
//   }
// }
