import { ExamType } from 'generated/prisma';

export class TestSeriesDto {
  id: string;
  title: string;
  description: string | null;
  type: ExamType;
  price: number;
  duration: number;
  features: string[];
  totalTests: number;
  isActive: boolean;
  teacherId: string;
  teacherName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TestSeriesListDto {
  id: string;
  title: string;
  description: string | null;
  type: ExamType;
  price: number;
  duration: number;
  features: string[];
  totalTests: number;
  isActive: boolean;
  teacherName: string | null;
}

export class TestSeriesDetailDto extends TestSeriesDto {
  exams?: TestSeriesExamDto[];
  isPurchased?: boolean;
  purchaseId?: string;
  validTill?: Date;
}

export class TestSeriesExamDto {
  id: string;
  title: string;
  description: string | null;
  type: ExamType;
  testType: string;
  subject: string | null;
  duration: number;
  totalMarks: number;
  totalQuestions: number;
  difficulty: string | null;
  isActive: boolean;
  isFree: boolean;
}
