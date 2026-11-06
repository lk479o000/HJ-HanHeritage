import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CoffinImageDto {
  imageUrl: string;
  imageType?: string;
  sort?: number;
}

export class CoffinModelDto {
  modelUrl: string;
  format?: string;
  fileSize?: number;
}

export class CreateCoffinDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  cliffId?: number;

  @IsOptional()
  @IsString()
  dynasty?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  completeness?: string;

  @IsOptional()
  @IsString()
  dimensions?: string;

  @IsOptional()
  @IsString()
  texture?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsNumber()
  status?: number;

  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  registryType?: string;

  @IsOptional()
  @IsString()
  tombGroup?: string;

  @IsOptional()
  @IsString()
  eraCategory?: string;

  @IsOptional()
  @IsString()
  eraSpecific?: string;

  @IsOptional()
  @IsString()
  artifactCategory?: string;

  @IsOptional()
  @IsString()
  materialCategory?: string;

  @IsOptional()
  @IsString()
  materialSpecific?: string;

  @IsOptional()
  @IsString()
  weightRange?: string;

  @IsOptional()
  @IsString()
  weightValue?: string;

  @IsOptional()
  @IsString()
  weightUnit?: string;

  @IsOptional()
  @IsString()
  sourceDetail?: string;

  @IsOptional()
  @IsString()
  completenessDetail?: string;

  @IsOptional()
  @IsString()
  preservationStatus?: string;

  @IsOptional()
  @IsString()
  accessionRange?: string;

  @IsOptional()
  @IsString()
  accessionYear?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  dimText?: string;

  @IsOptional()
  @IsNumber()
  mapLeft?: number;

  @IsOptional()
  @IsNumber()
  mapTop?: number;

  @IsOptional()
  @IsArray()
  images?: CoffinImageDto[];

  @IsOptional()
  @IsArray()
  models?: CoffinModelDto[];
}
