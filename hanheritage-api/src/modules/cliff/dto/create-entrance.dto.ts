import { IsOptional, IsNumber, IsString } from 'class-validator';

export class CreateEntranceDto {
  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  z?: number;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  intro?: string;
}
