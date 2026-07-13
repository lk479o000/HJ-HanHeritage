import { Module } from '@nestjs/common';
import { CliffController } from './cliff.controller';
import { CliffService } from './cliff.service';

@Module({
  controllers: [CliffController],
  providers: [CliffService],
  exports: [CliffService],
})
export class CliffModule {}
