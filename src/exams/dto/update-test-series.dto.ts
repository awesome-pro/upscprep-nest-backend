import { PartialType } from '@nestjs/swagger';
import { CreateTestSeriesDto } from './create-test-series.dto';

export class UpdateTestSeriesDto extends PartialType(CreateTestSeriesDto) {}
