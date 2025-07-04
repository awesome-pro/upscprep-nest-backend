import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnswerKeyDto, UpdateAnswerKeyDto } from '../dto';
import { AnswerKey } from 'generated/prisma';

@Injectable()
export class AnswerKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    teacherId: string,
    createAnswerKeyDto: CreateAnswerKeyDto,
  ): Promise<AnswerKey> {
    // Check if the exam exists
    const exam = await this.prisma.exam.findUnique({
      where: { id: createAnswerKeyDto.examId },
    });

    if (!exam) {
      throw new NotFoundException(
        `Exam with ID ${createAnswerKeyDto.examId} not found`,
      );
    }

    // Check if the teacher is authorized to create an answer key for this exam
    if (exam.teacherId !== teacherId) {
      // Check if the teacher is associated with the test series that contains this exam
      const isTeacherAssociated = await this.prisma.testSeries.findFirst({
        where: {
          id: exam.testSeriesId!,
          teacherId: teacherId,
        },
      });

      if (!isTeacherAssociated) {
        throw new ForbiddenException(
          'You are not authorized to create an answer key for this exam',
        );
      }
    }

    // Parse JSON fields if they are strings
    let answerData = createAnswerKeyDto.answerData;

    if (typeof answerData === 'string') {
      try {
        answerData = JSON.parse(answerData);
      } catch (error) {
        throw new BadRequestException('Invalid answer data format');
      }
    }

    // Check if an official answer key already exists for this exam
    if (createAnswerKeyDto.isOfficial) {
      const existingOfficialKey = await this.prisma.answerKey.findFirst({
        where: {
          examId: createAnswerKeyDto.examId,
          isOfficial: true,
        },
      });

      if (existingOfficialKey) {
        throw new BadRequestException(
          'An official answer key already exists for this exam',
        );
      }
    }

    // Create the answer key
    return this.prisma.answerKey.create({
      data: {
        examId: createAnswerKeyDto.examId,
        version: createAnswerKeyDto.version,
        answerData: answerData,
        isOfficial: createAnswerKeyDto.isOfficial,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findAll(examId?: string): Promise<AnswerKey[]> {
    const where = examId ? { examId } : {};

    return this.prisma.answerKey.findMany({
      where,
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string): Promise<AnswerKey> {
    const answerKey = await this.prisma.answerKey.findUnique({
      where: { id },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!answerKey) {
      throw new NotFoundException(`Answer key with ID ${id} not found`);
    }

    return answerKey;
  }

  async update(
    id: string,
    teacherId: string,
    updateAnswerKeyDto: UpdateAnswerKeyDto,
  ): Promise<AnswerKey> {
    // Check if answer key exists
    const existingAnswerKey = await this.prisma.answerKey.findUnique({
      where: { id },
      include: {
        exam: true,
      },
    });

    if (!existingAnswerKey) {
      throw new NotFoundException(`Answer key with ID ${id} not found`);
    }

    // Check if the teacher is authorized to update this answer key
    if (existingAnswerKey.exam.teacherId !== teacherId) {
      // Check if the teacher is associated with the test series that contains this exam
      const isTeacherAssociated = await this.prisma.testSeries.findFirst({
        where: {
          id: existingAnswerKey.exam.testSeriesId!,
          teacherId: teacherId,
        },
      });

      if (!isTeacherAssociated) {
        throw new ForbiddenException(
          'You are not authorized to update this answer key',
        );
      }
    }

    // Parse JSON fields if they are strings
    let answerData = updateAnswerKeyDto.answerData;

    if (typeof answerData === 'string') {
      try {
        answerData = JSON.parse(answerData);
      } catch (error) {
        throw new BadRequestException('Invalid answer data format');
      }
    }

    // Check if trying to set as official when another official key exists
    if (updateAnswerKeyDto.isOfficial && !existingAnswerKey.isOfficial) {
      const existingOfficialKey = await this.prisma.answerKey.findFirst({
        where: {
          examId: existingAnswerKey.examId,
          isOfficial: true,
          id: { not: id },
        },
      });

      if (existingOfficialKey) {
        throw new BadRequestException(
          'An official answer key already exists for this exam',
        );
      }
    }

    // Update the answer key
    return this.prisma.answerKey.update({
      where: { id },
      data: {
        version: updateAnswerKeyDto.version,
        answerData: answerData,
        isOfficial: updateAnswerKeyDto.isOfficial,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async remove(
    id: string,
    teacherId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    // Check if answer key exists
    const existingAnswerKey = await this.prisma.answerKey.findUnique({
      where: { id },
      include: {
        exam: true,
      },
    });

    if (!existingAnswerKey) {
      throw new NotFoundException(`Answer key with ID ${id} not found`);
    }

    // Check if the teacher is authorized to delete this answer key (or if admin)
    if (!isAdmin && existingAnswerKey.exam.teacherId !== teacherId) {
      // Check if the teacher is associated with the test series that contains this exam
      const isTeacherAssociated = await this.prisma.testSeries.findFirst({
        where: {
          id: existingAnswerKey.exam.testSeriesId!,
          teacherId: teacherId,
        },
      });

      if (!isTeacherAssociated) {
        throw new ForbiddenException(
          'You are not authorized to delete this answer key',
        );
      }
    }

    // Check if there are any attempts that have been evaluated using this answer key
    if (existingAnswerKey.isOfficial) {
      const evaluatedAttemptsCount = await this.prisma.attempt.count({
        where: {
          examId: existingAnswerKey.examId,
          status: 'EVALUATED',
        },
      });

      if (evaluatedAttemptsCount > 0) {
        throw new BadRequestException(
          'Cannot delete an official answer key that has been used for evaluation',
        );
      }
    }

    // Delete the answer key
    await this.prisma.answerKey.delete({
      where: { id },
    });
  }

  async getAnswerKeysByExam(examId: string): Promise<AnswerKey[]> {
    return this.findAll(examId);
  }

  async getOfficialAnswerKey(examId: string): Promise<AnswerKey> {
    const answerKey = await this.prisma.answerKey.findFirst({
      where: {
        examId,
        isOfficial: true,
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!answerKey) {
      throw new NotFoundException(
        `Official answer key for exam with ID ${examId} not found`,
      );
    }

    return answerKey;
  }
}
