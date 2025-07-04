import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSyllabusDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;
}
