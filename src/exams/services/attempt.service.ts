import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttemptDto, UpdateAttemptDto, QueryAttemptDto } from '../dto';
import {
  Attempt,
  AttemptStatus,
  Exam,
  PurchaseStatus,
  PurchaseType,
  UserRole,
} from 'generated/prisma';
import { PaginatedResult } from '../../util/pagination';

@Injectable()
export class AttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createAttemptDto: CreateAttemptDto,
  ): Promise<Attempt> {
    // Check if the exam exists and is active
    const exam = await this.prisma.exam.findUnique({
      where: {
        id: createAttemptDto.examId,
        isActive: true,
      },
    });

    if (!exam) {
      throw new NotFoundException(
        `Exam with ID ${createAttemptDto.examId} not found or is inactive`,
      );
    }

    // Check if the user has an active subscription or has purchased this exam
    const hasAccess = await this.checkExamAccess(userId, exam.id, exam.isFree);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    // Check if the user already has an attempt for this exam that is in progress
    const existingAttempt = await this.prisma.attempt.findFirst({
      where: {
        userId,
        examId: exam.id,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (existingAttempt) {
      throw new BadRequestException(
        'You already have an attempt in progress for this exam',
      );
    }

    // Parse JSON fields if they are strings
    let timeSpent = createAttemptDto.timeSpent;

    if (typeof timeSpent === 'string') {
      try {
        timeSpent = JSON.parse(timeSpent);
      } catch (error) {
        throw new BadRequestException('Invalid timeSpent format');
      }
    }

    if (typeof timeSpent === 'string') {
      try {
        timeSpent = JSON.parse(timeSpent);
      } catch (error) {
        throw new BadRequestException('Invalid timeSpent format');
      }
    }

    // Create the attempt
    return this.prisma.attempt.create({
      data: {
        userId,
        examId: exam.id,
        status: createAttemptDto.status || AttemptStatus.IN_PROGRESS,
        timeSpent,
        maxScore: exam.totalMarks,
        startTime: new Date(Date.now() + 2 * 60 * 1000),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
      },
    });
  }

  async findAll(queryDto: QueryAttemptDto): Promise<PaginatedResult<Attempt>> {
    const {
      page = 1,
      pageSize = 10,
      userId,
      examId,
      status,
      evaluationStatus,
      evaluatedBy,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = queryDto;

    // Build the where clause based on filters
    const where: any = {};

    if (userId) where.userId = userId;
    if (examId) where.examId = examId;
    if (status) where.status = status;
    if (evaluationStatus) where.evaluationStatus = evaluationStatus;
    if (evaluatedBy) where.evaluatedBy = evaluatedBy;
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { exam: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }
    // Count total items for pagination
    const totalItems = await this.prisma.attempt.count({ where });
    const totalPages = Math.ceil(totalItems / pageSize);

    // Determine sort field and direction
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const items = await this.prisma.attempt.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy,
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

  async findOne(id: string): Promise<Attempt> {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
            negativeMarking: true,
            correctMark: true,
            incorrectMark: true,
            questions: {
              select: {
                id: true,
                type: true,
                questionNumber: true,
                topic: true,
                options: true,
                text: true,
                marks: true,
                wordLimit: true,
                imageUrls: true,
              },
            },
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    return attempt;
  }

  async update(
    id: string,
    userId: string,
    updateAttemptDto: UpdateAttemptDto,
    isTeacher: boolean = false,
  ): Promise<Attempt> {
    // Check if attempt exists
    const existingAttempt = await this.prisma.attempt.findUnique({
      where: { id },
      include: {
        exam: true,
      },
    });

    if (!existingAttempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    // Check permissions
    if (!isTeacher && existingAttempt.userId !== userId) {
      throw new ForbiddenException('You can only update your own attempts');
    }

    // Parse JSON fields if they are strings
    let timeSpent = updateAttemptDto.timeSpent;
    let feedback = updateAttemptDto.feedback;

    if (typeof timeSpent === 'string') {
      try {
        timeSpent = JSON.parse(timeSpent);
      } catch (error) {
        throw new BadRequestException('Invalid timeSpent format');
      }
    }

    if (typeof feedback === 'string') {
      try {
        feedback = JSON.parse(feedback);
      } catch (error) {
        throw new BadRequestException('Invalid feedback format');
      }
    }

    // Prepare update data
    const updateData: any = {};

    // Fields that can be updated by the student
    if (!isTeacher) {
      if (updateAttemptDto.status !== undefined) {
        // Students can only update status to SUBMITTED or COMPLETED
        if (
          updateAttemptDto.status === AttemptStatus.SUBMITTED ||
          updateAttemptDto.status === AttemptStatus.COMPLETED
        ) {
          updateData.status = updateAttemptDto.status;

          // If submitting, set the submit time
          if (updateAttemptDto.status === AttemptStatus.SUBMITTED) {
            updateData.submitTime = new Date();
          }

          // If completing, set the end time
          if (updateAttemptDto.status === AttemptStatus.COMPLETED) {
            updateData.endTime = new Date();
          }
        } else {
          throw new BadRequestException('Invalid status update');
        }
      }

      if (timeSpent !== undefined) updateData.timeSpent = timeSpent;

      // If the student is submitting, calculate the score for MCQs automatically
      if (updateAttemptDto.status === AttemptStatus.SUBMITTED) {
        const scoreData = await this.calculateScore(
          existingAttempt.exam,
          existingAttempt.id,
        );

        if (scoreData) {
          updateData.score = scoreData.score;
          updateData.correctAnswers = scoreData.correctAnswers;
          updateData.incorrectAnswers = scoreData.incorrectAnswers;
          updateData.unattempted = scoreData.unattempted;
          updateData.accuracy = scoreData.accuracy;
          updateData.percentage =
            (scoreData.score / existingAttempt.maxScore) * 100;
        }
      }
    }
    // Fields that can only be updated by teachers
    else {
      if (updateAttemptDto.evaluationStatus !== undefined) {
        updateData.evaluationStatus = updateAttemptDto.evaluationStatus;
      }

      if (feedback !== undefined) updateData.feedback = feedback;

      if (updateAttemptDto.score !== undefined) {
        updateData.score = updateAttemptDto.score;
        updateData.percentage =
          (updateAttemptDto.score / existingAttempt.maxScore) * 100;
      }

      if (updateAttemptDto.status === AttemptStatus.EVALUATED) {
        updateData.status = AttemptStatus.EVALUATED;
        updateData.evaluatedBy = userId;
      }

      if (updateAttemptDto.correctAnswers !== undefined)
        updateData.correctAnswers = updateAttemptDto.correctAnswers;
      if (updateAttemptDto.incorrectAnswers !== undefined)
        updateData.incorrectAnswers = updateAttemptDto.incorrectAnswers;
      if (updateAttemptDto.unattempted !== undefined)
        updateData.unattempted = updateAttemptDto.unattempted;
      if (updateAttemptDto.accuracy !== undefined)
        updateData.accuracy = updateAttemptDto.accuracy;
      if (updateAttemptDto.rank !== undefined)
        updateData.rank = updateAttemptDto.rank;
      if (updateAttemptDto.answerSheetUrl !== undefined)
        updateData.answerSheetUrl = updateAttemptDto.answerSheetUrl;
    }

    // Update the attempt
    return this.prisma.attempt.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            totalMarks: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    // Check if attempt exists
    const existingAttempt = await this.prisma.attempt.findUnique({
      where: { id },
    });

    if (!existingAttempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    // Only the user who created the attempt or an admin can delete it
    if (!isAdmin && existingAttempt.userId !== userId) {
      throw new ForbiddenException('You can only delete your own attempts');
    }

    // Delete the attempt
    await this.prisma.attempt.delete({
      where: { id },
    });
  }

  async getAttemptsByUser(
    userId: string,
    queryDto: QueryAttemptDto,
  ): Promise<PaginatedResult<Attempt>> {
    return this.findAll({ ...queryDto, userId });
  }

  async getAttemptsByExam(
    examId: string,
    queryDto: QueryAttemptDto,
  ): Promise<PaginatedResult<Attempt>> {
    return this.findAll({ ...queryDto, examId });
  }

  async getAttemptsByEvaluator(
    evaluatorId: string,
    queryDto: QueryAttemptDto,
  ): Promise<PaginatedResult<Attempt>> {
    return this.findAll({ ...queryDto, evaluatedBy: evaluatorId });
  }

  async assignAttemptToEvaluator(
    attemptId: string,
    evaluatorId: string,
    adminId: string,
  ): Promise<Attempt> {
    // Check if admin has permission
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can assign attempts to evaluators',
      );
    }

    // Check if attempt exists
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Check if evaluator exists and is a teacher
    const evaluator = await this.prisma.user.findUnique({
      where: { id: evaluatorId },
    });

    if (!evaluator || evaluator.role !== UserRole.TEACHER) {
      throw new BadRequestException('Evaluator must be a teacher');
    }

    // Assign the attempt to the evaluator
    return this.prisma.attempt.update({
      where: { id: attemptId },
      data: {
        evaluatedBy: evaluatorId,
        evaluationStatus: 'Assigned',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
        evaluator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Helper methods
  private async checkExamAccess(
    userId: string,
    examId: string,
    isFree: boolean,
  ): Promise<boolean> {
    // If the exam is free, everyone has access
    if (isFree) {
      return true;
    }

    // Check if the user has purchased this exam
    const examPurchase = await this.prisma.purchase.findFirst({
      where: {
        userId,
        status: PurchaseStatus.COMPLETED,
        type: PurchaseType.INDIVIDUAL_EXAM,
        examId: examId,
      },
    });

    if (examPurchase) {
      return true;
    }

    // Check if the user has purchased the test series that contains this exam
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { testSeriesId: true },
    });

    if (exam?.testSeriesId) {
      const testSeriesPurchase = await this.prisma.purchase.findFirst({
        where: {
          userId,
          status: PurchaseStatus.COMPLETED,
          type: PurchaseType.TEST_SERIES,
          testSeriesId: exam.testSeriesId,
        },
      });

      if (testSeriesPurchase) {
        return true;
      }
    }

    return false;
  }

  private async calculateScore(exam: Exam, attemptId: string): Promise<any> {
    try {
      // Get all answers for this attempt with their questions
      const answers = await this.prisma.answer.findMany({
        where: { attemptId },
        include: { question: true },
      });

      // Get all questions for this exam to calculate unattempted questions
      const examQuestions = await this.prisma.question.findMany({
        where: { examId: exam.id },
      });

      let score = 0;
      let correctAnswers = 0;
      let incorrectAnswers = 0;

      // Calculate score based on MCQ answers
      answers.forEach((answer) => {
        // For MCQ questions
        if (answer.question.type === 'MCQ' && answer.selectedOption) {
          if (answer.selectedOption === answer.question.correctOption) {
            // Correct answer
            score += answer.question.marks || 1;
            correctAnswers++;
          } else {
            // Incorrect answer
            incorrectAnswers++;
            // Apply negative marking if enabled
            if (exam.negativeMarking) {
              const negativeMarks = exam.incorrectMark || 0;
              score += negativeMarks;
            }
          }
        }

        // For descriptive questions that have been evaluated
        if (
          answer.question.type === 'DESCRIPTIVE' &&
          answer.marks !== null &&
          answer.marks !== undefined
        ) {
          score += answer.marks;
          // Count as correct if more than half marks obtained
          if (answer.marks >= answer.question.marks / 2) {
            correctAnswers++;
          } else {
            incorrectAnswers++;
          }
        }
      });

      // Ensure score is not negative
      score = Math.max(0, score);

      // Calculate unattempted questions
      const unattempted = examQuestions.length - answers.length;

      // Calculate accuracy
      const accuracy =
        correctAnswers > 0
          ? (correctAnswers / (correctAnswers + incorrectAnswers)) * 100
          : 0;

      return {
        score,
        correctAnswers,
        incorrectAnswers,
        unattempted,
        accuracy,
      };
    } catch (error) {
      console.error('Error calculating score:', error);
      return null;
    }
  }
}
