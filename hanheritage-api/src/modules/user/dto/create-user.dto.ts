import { IsString, IsNotEmpty, IsOptional, IsInt, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  account: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

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
