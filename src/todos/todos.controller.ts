import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../generated/prisma';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginatedResponse } from '../util/pagination';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTodoDto: CreateTodoDto, @CurrentUser() user: User) {
    return this.todosService.create(createTodoDto, user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@CurrentUser() user: User, @Query() query: QueryTodoDto) {
    return this.todosService.findAll(user.id, query);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  getTodoStats(@CurrentUser() user: User) {
    return this.todosService.getTodoStats(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.todosService.findOne(id, user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @CurrentUser() user: User,
  ) {
    return this.todosService.update(id, updateTodoDto, user.id, user.role);
  }

  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  toggleComplete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.todosService.toggleComplete(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.todosService.remove(id, user.id, user.role);
  }
}
