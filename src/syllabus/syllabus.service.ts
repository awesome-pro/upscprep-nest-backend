// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateSyllabusDto, UpdateSyllabusDto, QuerySyllabusDto } from './dto';
// import { Syllabus, User, UserRole, Prisma } from '../../generated/prisma';
// import { PaginatedResponse, createPaginatedResponse } from '../util/pagination';

// @Injectable()
// export class SyllabusService {
//   constructor(private readonly prisma: PrismaService) {}

//   /**
//    * Create a new syllabus
//    */
//   async create(
//     createSyllabusDto: CreateSyllabusDto,
//     userId: string,
//   ): Promise<Syllabus> {
//     // Check if user is a teacher or admin
//     const user = await this.prisma.user.findUniqueOrThrow({
//       where: { id: userId },
//       select: { role: true },
//     });

//     if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
//       throw new ForbiddenException(
//         'Only teachers and admins can create syllabuses',
//       );
//     }

//     return this.prisma.syllabus.create({
//       data: {
//         ...createSyllabusDto,
//         teacher: {
//           connect: { id: userId },
//         },
//       },
//     });
//   }

//   /**
//    * Find all syllabuses with optional filtering
//    */
//   async findAll(
//     queryDto: QuerySyllabusDto,
//   ): Promise<PaginatedResponse<Syllabus>> {
//     const { title, page = 1, pageSize = 10 } = queryDto;

//     // Calculate skip for pagination
//     const skip = (page - 1) * pageSize;

//     // Build where clause for filtering
//     const where: Prisma.SyllabusWhereInput = {
//       ...(title && {
//         title: { contains: title, mode: 'insensitive' as Prisma.QueryMode },
//       }),
//     };

//     // Get total count for pagination
//     const total = await this.prisma.syllabus.count({ where });

//     // Get syllabuses with pagination
//     const syllabuses = await this.prisma.syllabus.findMany({
//       where,
//       skip,
//       take: pageSize,
//       orderBy: { createdAt: 'desc' },
//       include: {
//         teacher: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     return createPaginatedResponse(syllabuses, total, pageSize, page);
//   }

//   /**
//    * Find syllabuses created by a specific teacher
//    */
//   async findByTeacher(
//     teacherId: string,
//     queryDto: QuerySyllabusDto,
//   ): Promise<PaginatedResponse<Syllabus>> {
//     const { title, page = 1, pageSize = 10 } = queryDto;

//     // Calculate skip for pagination
//     const skip = (page - 1) * pageSize;

//     // Build where clause for filtering
//     const where: Prisma.SyllabusWhereInput = {
//       teacherId,
//       ...(title && {
//         title: { contains: title, mode: 'insensitive' as Prisma.QueryMode },
//       }),
//     };

//     // Get total count for pagination
//     const total = await this.prisma.syllabus.count({ where });

//     // Get syllabuses with pagination
//     const syllabuses = await this.prisma.syllabus.findMany({
//       where,
//       skip,
//       take: pageSize,
//       orderBy: { createdAt: 'desc' },
//       include: {
//         teacher: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     return createPaginatedResponse(syllabuses, total, pageSize, page);
//   }

//   /**
//    * Find a specific syllabus by ID
//    */
//   async findOne(id: string): Promise<Syllabus> {
//     const syllabus = await this.prisma.syllabus.findUnique({
//       where: { id },
//       include: {
//         teacher: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!syllabus) {
//       throw new NotFoundException(`Syllabus with ID ${id} not found`);
//     }

//     return syllabus;
//   }

//   /**
//    * Update a syllabus
//    */
//   async update(
//     id: string,
//     updateSyllabusDto: UpdateSyllabusDto,
//     userId: string,
//     userRole: UserRole,
//   ): Promise<Syllabus> {
//     // Check if syllabus exists
//     const syllabus = await this.prisma.syllabus.findUnique({
//       where: { id },
//     });

//     if (!syllabus) {
//       throw new NotFoundException(`Syllabus with ID ${id} not found`);
//     }

//     // Only allow the creator or an admin to update the syllabus
//     if (syllabus.teacherId !== userId && userRole !== UserRole.ADMIN) {
//       throw new ForbiddenException(
//         'You do not have permission to update this syllabus',
//       );
//     }

//     // Update the syllabus
//     return this.prisma.syllabus.update({
//       where: { id },
//       data: updateSyllabusDto,
//     });
//   }

//   /**
//    * Delete a syllabus
//    */
//   async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
//     // Check if syllabus exists
//     const syllabus = await this.prisma.syllabus.findUnique({
//       where: { id },
//     });

//     if (!syllabus) {
//       throw new NotFoundException(`Syllabus with ID ${id} not found`);
//     }

//     // Only allow the creator or an admin to delete the syllabus
//     if (syllabus.teacherId !== userId && userRole !== UserRole.ADMIN) {
//       throw new ForbiddenException(
//         'You do not have permission to delete this syllabus',
//       );
//     }

//     // Delete the syllabus
//     await this.prisma.syllabus.delete({
//       where: { id },
//     });
//   }

//   /**
//    * Search syllabuses by title or content
//    */
//   async search(
//     searchTerm: string,
//     page = 1,
//     pageSize = 10,
//   ): Promise<PaginatedResponse<Syllabus>> {
//     // Calculate skip for pagination
//     const skip = (page - 1) * pageSize;

//     const where: Prisma.SyllabusWhereInput = {
//       OR: [
//         {
//           title: {
//             contains: searchTerm,
//             mode: 'insensitive' as Prisma.QueryMode,
//           },
//         },
//         {
//           content: {
//             contains: searchTerm,
//             mode: 'insensitive' as Prisma.QueryMode,
//           },
//         },
//       ],
//     };

//     // Get total count for pagination
//     const total = await this.prisma.syllabus.count({ where });

//     // Get syllabuses with pagination
//     const syllabuses = await this.prisma.syllabus.findMany({
//       where,
//       skip,
//       take: pageSize,
//       orderBy: { createdAt: 'desc' },
//       include: {
//         teacher: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     return createPaginatedResponse(syllabuses, total, pageSize, page);
//   }
// }
