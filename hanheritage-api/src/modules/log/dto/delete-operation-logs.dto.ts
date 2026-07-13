import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class DeleteOperationLogsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
