import { CourseType } from 'generated/prisma';

export class CourseDto {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  subject: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  totalStudents: number;
  totalModules: number;
  totalDuration: number;
  teacherId: string;
  teacherName?: string;
  createdAt: Date;
  updatedAt: Date;
  images: string[];
}

export class CourseListDto {
  id: string;
  title: string;
  description: string;
  type: CourseType;
  subject: string;
  price: number;
  duration: number;
  features: string[];
  isActive: boolean;
  totalStudents: number;
  totalModules: number;
  totalDuration: number;
  teacherName?: string;
  images: string[];
}

export class CourseDetailDto extends CourseDto {
  modules?: CourseModuleDto[];
  isPurchased?: boolean;
  purchaseId?: string;
  validTill?: Date;
}

export class CourseModuleDto {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  lessons?: CourseLessonDto[];
}

export class CourseLessonDto {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPreview: boolean;
  isMandatory: boolean;
  videoDuration?: number;
  textContent?: string;
  videoUrls?: string[];
  fileUrls?: string[];
  quizData?: any;
}
