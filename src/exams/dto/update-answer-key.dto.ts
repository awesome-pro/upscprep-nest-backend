import { PartialType } from '@nestjs/swagger';
import { CreateAnswerKeyDto } from './create-answer-key.dto';

export class UpdateAnswerKeyDto extends PartialType(CreateAnswerKeyDto) {}
