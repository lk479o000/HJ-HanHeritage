import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PanoramaService } from './panorama.service';
import { CreatePanoramaDto } from './dto/create-panorama.dto';

@Controller('panoramas')
export class PanoramaController {
  constructor(private panoramaService: PanoramaService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.panoramaService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      keyword,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.panoramaService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePanoramaDto) {
    return this.panoramaService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreatePanoramaDto) {
    return this.panoramaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.panoramaService.remove(id);
  }

  @Post(':id/viewpoints')
  addViewpoint(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('lng') lng?: number,
    @Body('lat') lat?: number,
    @Body('height') height?: number,
  ) {
    return this.panoramaService.addViewpoint(id, { name, lng, lat, height });
  }

  @Delete(':panoramaId/viewpoints/:viewpointId')
  removeViewpoint(@Param('panoramaId') panoramaId: string, @Param('viewpointId') viewpointId: string) {
    return this.panoramaService.removeViewpoint(panoramaId, viewpointId);
  }

  @Post(':id/hotspots')
  addHotspot(
    @Param('id') id: string,
    @Body('type') type: string,
    @Body('config') config?: string,
    @Body('posX') posX?: number,
    @Body('posY') posY?: number,
  ) {
    return this.panoramaService.addHotspot(id, { type, config, posX, posY });
  }

  @Delete(':panoramaId/hotspots/:hotspotId')
  removeHotspot(@Param('panoramaId') panoramaId: string, @Param('hotspotId') hotspotId: string) {
    return this.panoramaService.removeHotspot(panoramaId, hotspotId);
  }
}
