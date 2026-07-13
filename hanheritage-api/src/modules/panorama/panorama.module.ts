import { Module } from '@nestjs/common';
import { PanoramaController } from './panorama.controller';
import { PanoramaService } from './panorama.service';

@Module({
  controllers: [PanoramaController],
  providers: [PanoramaService],
  exports: [PanoramaService],
})
export class PanoramaModule {}
