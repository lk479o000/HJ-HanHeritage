import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PanoramaService } from './panorama.service';
import { CreatePanoramaDto } from './dto/create-panorama.dto';
import { assertUploadedFile, createUploadOptions } from '../../common/upload/upload-policy';

@Controller('panoramas')
export class PanoramaController {
  constructor(private panoramaService: PanoramaService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
  ) {
    return this.panoramaService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      keyword,
      category,
      status,
    );
  }

  @Post(':id/upload')
  @UseInterceptors(
    FileInterceptor('file', createUploadOptions({ subdir: 'panorama', categories: ['panorama'] })),
  )
  upload(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请选择要上传的全景图');
    }
    assertUploadedFile(file, 'panorama');
    const url = `/uploads/panorama/${file.filename}`;
    return this.panoramaService.uploadFile(id, url, file.size);
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
