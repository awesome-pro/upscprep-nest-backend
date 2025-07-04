import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto';
import { Todo, User, UserRole, Prisma } from '../../generated/prisma';
import { PaginatedResponse, createPaginatedResponse } from '../util/pagination';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new todo item
   */
  async create(createTodoDto: CreateTodoDto, userId: string): Promise<Todo> {
    return this.prisma.todo.create({
      data: {
        ...createTodoDto,
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  /**
   * Find all todos for a user with optional filtering
   */
  async findAll(
    userId: string,
    queryDto: QueryTodoDto,
  ): Promise<PaginatedResponse<Todo>> {
    const { title, completed, page = 1, pageSize = 10 } = queryDto;

    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;

    // Build where clause for filtering
    const where: Prisma.TodoWhereInput = {
      userId: userId,
      ...(completed !== undefined && { completed }),
      ...(title && {
        title: { contains: title, mode: 'insensitive' as Prisma.QueryMode },
      }),
    };

    // Get total count for pagination
    const total = await this.prisma.todo.count({ where });

    // Get todos with pagination
    const todos = await this.prisma.todo.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });

    return createPaginatedResponse(todos, total, pageSize, page);
  }

  /**
   * Find a specific todo by ID
   */
  async findOne(id: string, userId: string): Promise<Todo> {
    const todo = await this.prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Check if the todo belongs to the user
    if (todo.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this todo',
      );
    }

    return todo;
  }

  /**
   * Update a todo item
   */
  async update(
    id: string,
    updateTodoDto: UpdateTodoDto,
    userId: string,
    userRole: UserRole,
  ): Promise<Todo> {
    // Check if todo exists and belongs to the user
    const todo = await this.prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Only allow the owner or an admin to update the todo
    if (todo.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to update this todo',
      );
    }

    // Update the todo
    return this.prisma.todo.update({
      where: { id },
      data: updateTodoDto,
    });
  }

  /**
   * Toggle the completed status of a todo
   */
  async toggleComplete(id: string, userId: string): Promise<Todo> {
    // Check if todo exists and belongs to the user
    const todo = await this.findOne(id, userId);

    // Toggle the completed status
    return this.prisma.todo.update({
      where: { id },
      data: { completed: !todo.completed },
    });
  }

  /**
   * Delete a todo item
   */
  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    // Check if todo exists and belongs to the user
    const todo = await this.prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Only allow the owner or an admin to delete the todo
    if (todo.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'You do not have permission to delete this todo',
      );
    }

    // Delete the todo
    await this.prisma.todo.delete({
      where: { id },
    });
  }

  /**
   * Get todo statistics for a user
   */
  async getTodoStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  }> {
    const total = await this.prisma.todo.count({
      where: { userId: userId },
    });

    const completed = await this.prisma.todo.count({
      where: { userId: userId, completed: true },
    });

    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      completionRate,
    };
  }
}
