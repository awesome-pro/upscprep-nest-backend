import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnswerDto, EvaluateAnswerDto, UpdateAnswerDto } from '../dto';
import {
  Answer,
  AttemptStatus,
  Exam,
  Question,
  QuestionType,
} from 'generated/prisma';

@Injectable()
export class AnswerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createAnswerDto: CreateAnswerDto,
  ): Promise<Answer> {
    // Verify the attempt exists and belongs to the user
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: createAnswerDto.attemptId },
      include: {
        exam: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(
        `Attempt with ID ${createAnswerDto.attemptId} not found`,
      );
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException(
        'You can only submit answers to your own attempts',
      );
    }

    if (attempt.status === 'SUBMITTED' || attempt.status === 'EVALUATED') {
      throw new BadRequestException(
        'Cannot modify answers for a submitted or evaluated attempt',
      );
    }

    // Verify the question exists and belongs to the exam
    const question = await this.prisma.question.findUnique({
      where: { id: createAnswerDto.questionId },
    });

    if (!question) {
      throw new NotFoundException(
        `Question with ID ${createAnswerDto.questionId} not found`,
      );
    }

    if (question.examId !== attempt.examId) {
      throw new BadRequestException(
        'Question does not belong to the exam being attempted',
      );
    }

    // Check if an answer already exists for this question in this attempt
    const existingAnswer = await this.prisma.answer.findUnique({
      where: {
        attemptId_questionId: {
          attemptId: createAnswerDto.attemptId,
          questionId: createAnswerDto.questionId,
        },
      },
    });

    // For MCQ questions, automatically calculate marks if the exam has negative marking
    let marks: number | null = null;
    if (
      question.type === QuestionType.MCQ &&
      createAnswerDto.selectedOption &&
      attempt.exam.negativeMarking
    ) {
      if (createAnswerDto.selectedOption === question.correctOption) {
        marks = attempt.exam.correctMark;
      } else {
        marks = attempt.exam.incorrectMark;
      }
    }

    // Create or update the answer
    if (existingAnswer) {
      return this.prisma.answer.update({
        where: {
          attemptId_questionId: {
            attemptId: createAnswerDto.attemptId,
            questionId: createAnswerDto.questionId,
          },
        },
        data: {
          selectedOption: createAnswerDto.selectedOption,
          answerText: createAnswerDto.answerText,
          timeSpent: createAnswerDto.timeSpent,
          marks: marks,
        },
      });
    } else {
      return this.prisma.answer.create({
        data: {
          attemptId: createAnswerDto.attemptId,
          questionId: createAnswerDto.questionId,
          selectedOption: createAnswerDto.selectedOption,
          answerText: createAnswerDto.answerText,
          timeSpent: createAnswerDto.timeSpent,
          marks: marks,
        },
      });
    }
  }

  async update(
    id: string,
    userId: string,
    updateAnswerDto: UpdateAnswerDto,
  ): Promise<Answer> {
    // Get the answer with related data
    const answer = await this.findOne(id);

    if (answer.attempt.userId !== userId) {
      throw new ForbiddenException(
        'You can only update answers for your own attempts',
      );
    }

    // Check if the attempt is still in progress
    if (answer.attempt.status !== 'IN_PROGRESS') {
      throw new ForbiddenException(
        'Cannot update answers for a completed or submitted attempt',
      );
    }

    // Get the question to check its type
    const question = await this.prisma.question.findUnique({
      where: { id: answer.questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Prepare update data based on question type
    const updateData: any = {};

    // Handle MCQ answers
    if (question.type === 'MCQ') {
      if (updateAnswerDto.selectedOption !== undefined) {
        // Validate that the selected option exists in the question options
        const options = question.options as string[];
        if (
          updateAnswerDto.selectedOption &&
          !options.includes(updateAnswerDto.selectedOption)
        ) {
          throw new BadRequestException(
            'Selected option is not valid for this question',
          );
        }
        updateData.selectedOption = updateAnswerDto.selectedOption;
      }

      // Clear descriptive answer fields if switching to MCQ
      if (updateAnswerDto.selectedOption && answer.answerText) {
        updateData.answerText = null;
      }
    }
    // Handle descriptive answers
    else if (question.type === 'DESCRIPTIVE') {
      if (updateAnswerDto.answerText !== undefined) {
        updateData.answerText = updateAnswerDto.answerText;
      }

      // Clear MCQ answer fields if switching to descriptive
      if (updateAnswerDto.answerText && answer.selectedOption) {
        updateData.selectedOption = null;
      }
    }

    // Update time spent (accumulate time)
    if (updateAnswerDto.timeSpent !== undefined) {
      // If we're updating time spent, add to the existing value rather than replacing
      updateData.timeSpent =
        (answer.timeSpent || 0) + updateAnswerDto.timeSpent;
    }

    // Update the answer
    return this.prisma.answer.update({
      where: { id },
      data: updateData,
      include: {
        question: true,
        attempt: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
      },
    });
  }

  async findByAttempt(attemptId: string): Promise<Answer[]> {
    return this.prisma.answer.findMany({
      where: { attemptId },
      include: {
        question: true,
      },
      orderBy: {
        question: {
          questionNumber: 'asc',
        },
      },
    });
  }

  async findOne(id: string): Promise<
    Answer & {
      question: Question;
      attempt: {
        userId: string;
        status: AttemptStatus;
        exam: Exam;
        user: {
          id: string;
          name: string;
        };
      };
    }
  > {
    const answer = await this.prisma.answer.findUnique({
      where: { id },
      include: {
        question: true,
        attempt: {
          include: {
            exam: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!answer) {
      throw new NotFoundException(`Answer with ID ${id} not found`);
    }

    return answer;
  }

  async evaluate(
    id: string,
    teacherId: string,
    evaluateAnswerDto: EvaluateAnswerDto,
  ): Promise<Answer> {
    // Get the answer with related data
    const answer = await this.findOne(id);

    // Check if the teacher owns the exam
    if (answer.attempt.exam.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only evaluate answers for your own exams',
      );
    }

    // Update the answer with evaluation
    return this.prisma.answer.update({
      where: { id },
      data: {
        marks: evaluateAnswerDto.marks,
        feedback: evaluateAnswerDto.feedback,
        evaluatedBy: teacherId,
        evaluatedAt: new Date(),
      },
    });
  }

  async bulkEvaluate(
    attemptId: string,
    teacherId: string,
    evaluations: { questionId: string; marks: number; feedback?: string }[],
  ): Promise<{ count: number }> {
    // Verify the attempt exists
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Check if the teacher owns the exam
    if (attempt.exam.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only evaluate answers for your own exams',
      );
    }

    // Evaluate answers in a transaction
    let evaluatedCount = 0;
    let totalMarks = 0;

    await this.prisma.$transaction(async (prisma) => {
      for (const evaluation of evaluations) {
        // Find the answer
        const answer = await prisma.answer.findUnique({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: evaluation.questionId,
            },
          },
        });

        if (answer) {
          await prisma.answer.update({
            where: { id: answer.id },
            data: {
              marks: evaluation.marks,
              feedback: evaluation.feedback,
              evaluatedBy: teacherId,
              evaluatedAt: new Date(),
            },
          });

          totalMarks += evaluation.marks;
          evaluatedCount++;
        }
      }

      // Update the attempt status and score
      await prisma.attempt.update({
        where: { id: attemptId },
        data: {
          status: 'EVALUATED',
          score: totalMarks,
          evaluatedBy: teacherId,
        },
      });
    });

    return { count: evaluatedCount };
  }
}
