import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export interface CliffImageInput {
  imageUrl: string;
  imageType?: string;
  sort?: number;
}

export class CreateCliffDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  area?: number;

  @IsOptional()
  @IsString()
  town?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  protectionUnitName?: string;

  @IsOptional()
  @IsString()
  composition?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  dynasty?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  modelUrl?: string;

  @IsOptional()
  @IsArray()
  images?: CliffImageInput[];

  @IsOptional()
  @IsNumber()
  status?: number;

  @IsOptional()
  @IsNumber()
  mapLeft?: number;

  @IsOptional()
  @IsNumber()
  mapTop?: number;

  @IsOptional()
  @IsNumber()
  featured?: number;
}
