import { IsString, IsOptional, IsNumber, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  type?: number;

  @IsOptional()
  @IsString()
  dataScope?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sort?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number | null;

  @IsOptional()
  menuIds?: number[];

  @IsOptional()
  @IsArray()
  permissionIds?: string[];
}
