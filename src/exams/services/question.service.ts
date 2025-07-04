import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, QueryQuestionDto } from '../dto';
import { Question, QuestionType, UserRole } from 'generated/prisma';
import { PaginatedResult } from '../../util/pagination';

@Injectable()
export class QuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    teacherId: string,
    createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    // Verify the exam exists and belongs to the teacher
    const exam = await this.prisma.exam.findUnique({
      where: { id: createQuestionDto.examId },
    });

    if (!exam) {
      throw new NotFoundException(
        `Exam with ID ${createQuestionDto.examId} not found`,
      );
    }

    if (exam.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only add questions to your own exams',
      );
    }
    // Create the question
    const question = await this.prisma.question.create({
      data: {
        examId: createQuestionDto.examId,
        type: createQuestionDto.type,
        questionNumber: createQuestionDto.questionNumber,
        text: createQuestionDto.text,
        marks: createQuestionDto.marks,
        options: createQuestionDto.options,
        correctOption: createQuestionDto.correctOption,
        explanation: createQuestionDto.explanation,
        expectedAnswerPoints: createQuestionDto.expectedAnswerPoints || [],
        wordLimit: createQuestionDto.wordLimit,
        modelAnswer: createQuestionDto.modelAnswer,
        difficulty: createQuestionDto.difficulty,
        topic: createQuestionDto.topic || 'GS1',
        imageUrls: createQuestionDto.imageUrls || [],
        isActive: createQuestionDto.isActive ?? true,
      },
    });

    // Update exam's totalQuestions count
    await this.prisma.exam.update({
      where: { id: createQuestionDto.examId },
      data: {
        totalQuestions: {
          increment: 1,
        },
      },
    });

    return question;
  }

  async findAll(
    queryDto: QueryQuestionDto,
  ): Promise<PaginatedResult<Question>> {
    const {
      page = 1,
      pageSize = 10,
      search,
      examId,
      type,
      difficulty,
      topic,
    } = queryDto;

    // Build the where clause based on filters
    const where: any = {};

    if (search) {
      where.OR = [
        { text: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (examId) where.examId = examId;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (topic) where.topic = { contains: topic, mode: 'insensitive' };

    // Count total items for pagination
    const totalItems = await this.prisma.question.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Get paginated results
    const items = await this.prisma.question.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: [{ examId: 'asc' }, { questionNumber: 'asc' }],
    });

    // Parse options from JSON string to array for MCQ questions
    items.forEach((question) => {
      if (
        question.type === QuestionType.MCQ &&
        question.options &&
        typeof question.options === 'string'
      ) {
        try {
          (question as any).options = JSON.parse(question.options);
        } catch (error) {
          console.error(
            `Failed to parse options for question ${question.id}: ${error.message}`,
          );
        }
      }
    });

    return {
      data: items,
      meta: {
        total: totalItems,
        pageSize,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findByExam(examId: string): Promise<Question[]> {
    return this.prisma.question.findMany({
      where: { examId },
      orderBy: { questionNumber: 'asc' },
    });
  }

  async findOne(id: string): Promise<
    Question & {
      exam: {
        id: string;
        title: string;
        type: string;
        teacherId: string;
      };
    }
  > {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            type: true,
            teacherId: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
    }

    // Parse options from JSON string to array if it exists and is a string
    if (
      question.type === QuestionType.MCQ &&
      question.options &&
      typeof question.options === 'string'
    ) {
      try {
        (question as any).options = JSON.parse(question.options);
      } catch (error) {
        console.error(
          `Failed to parse options for question ${id}: ${error.message}`,
        );
      }
    }

    return question;
  }

  async update(
    id: string,
    teacherId: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    // Check if question exists
    const question = await this.findOne(id);

    // Check if the teacher owns the exam
    if (question.exam.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only update questions in your own exams',
      );
    }

    // Update the question
    return this.prisma.question.update({
      where: { id },
      data: {
        type: updateQuestionDto.type,
        questionNumber: updateQuestionDto.questionNumber,
        text: updateQuestionDto.text,
        marks: updateQuestionDto.marks,
        options: updateQuestionDto.options,
        correctOption: updateQuestionDto.correctOption,
        explanation: updateQuestionDto.explanation,
        expectedAnswerPoints: updateQuestionDto.expectedAnswerPoints,
        wordLimit: updateQuestionDto.wordLimit,
        modelAnswer: updateQuestionDto.modelAnswer,
        difficulty: updateQuestionDto.difficulty,
        topic: updateQuestionDto.topic,
        imageUrls: updateQuestionDto.imageUrls,
        isActive: updateQuestionDto.isActive,
      },
    });
  }

  async remove(id: string, teacherId: string): Promise<void> {
    // Check if question exists
    const question = await this.findOne(id);

    // Check if the teacher owns the exam
    if (question.exam.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only delete questions in your own exams',
      );
    }

    // Check if there are any answers for this question
    const answersCount = await this.prisma.answer.count({
      where: { questionId: id },
    });

    if (answersCount > 0) {
      // Instead of deleting, just mark as inactive
      await this.prisma.question.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // If no answers, we can safely delete
      await this.prisma.question.delete({
        where: { id },
      });

      // Update exam's totalQuestions count
      await this.prisma.exam.update({
        where: { id: question.examId },
        data: {
          totalQuestions: {
            decrement: 1,
          },
        },
      });
    }
  }

  async bulkCreate(
    teacherId: string,
    questions: CreateQuestionDto[],
  ): Promise<{ count: number }> {
    if (!questions.length) {
      throw new BadRequestException('No questions provided');
    }

    // All questions should belong to the same exam
    const examId = questions[0].examId;

    // Verify the exam exists and belongs to the teacher
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    if (exam.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only add questions to your own exams',
      );
    }

    // Create questions in a transaction
    let createdCount = 0;
    await this.prisma.$transaction(async (prisma) => {
      for (const questionDto of questions) {
        await prisma.question.create({
          data: {
            examId: questionDto.examId,
            type: questionDto.type,
            questionNumber: questionDto.questionNumber,
            text: questionDto.text,
            marks: questionDto.marks,
            options: questionDto.options,
            correctOption: questionDto.correctOption,
            explanation: questionDto.explanation,
            expectedAnswerPoints: questionDto.expectedAnswerPoints || [],
            wordLimit: questionDto.wordLimit,
            modelAnswer: questionDto.modelAnswer,
            difficulty: questionDto.difficulty,
            topic: questionDto.topic || 'GS1',
            imageUrls: questionDto.imageUrls || [],
            isActive: questionDto.isActive ?? true,
          },
        });

        createdCount++;
      }

      // Update exam's totalQuestions count
      await prisma.exam.update({
        where: { id: examId },
        data: {
          totalQuestions: {
            increment: createdCount,
          },
        },
      });
    });

    return { count: createdCount };
  }
}
