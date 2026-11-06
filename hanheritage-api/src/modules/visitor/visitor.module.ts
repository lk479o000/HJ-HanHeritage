import { Module } from '@nestjs/common';
import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';

@Module({
  controllers: [VisitorController],
  providers: [VisitorService],
})
export class VisitorModule {}
