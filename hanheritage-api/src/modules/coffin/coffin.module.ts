import { Module } from '@nestjs/common';
import { CoffinController } from './coffin.controller';
import { CoffinService } from './coffin.service';

@Module({
  controllers: [CoffinController],
  providers: [CoffinService],
  exports: [CoffinService],
})
export class CoffinModule {}
