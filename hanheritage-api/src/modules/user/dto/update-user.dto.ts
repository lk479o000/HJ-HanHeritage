import { IsString, IsOptional, IsInt, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  deptId?: number;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  roleIds?: number[];

  @IsOptional()
  postIds?: number[];
}
