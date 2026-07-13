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
import { CoffinService } from './coffin.service';
import { CreateCoffinDto } from './dto/create-coffin.dto';

@Controller('coffins')
export class CoffinController {
  constructor(private coffinService: CoffinService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.coffinService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      keyword,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coffinService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCoffinDto) {
    return this.coffinService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateCoffinDto) {
    return this.coffinService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.coffinService.remove(id);
  }

  @Post(':id/images')
  addImage(
    @Param('id') id: string,
    @Body('imageUrl') imageUrl: string,
    @Body('imageType') imageType: string,
    @Body('sort') sort?: number,
  ) {
    return this.coffinService.addImage(id, imageUrl, imageType, sort);
  }

  @Delete(':coffinId/images/:imageId')
  removeImage(@Param('coffinId') coffinId: string, @Param('imageId') imageId: string) {
    return this.coffinService.removeImage(coffinId, imageId);
  }

  @Post(':id/models')
  addModel(
    @Param('id') id: string,
    @Body('modelUrl') modelUrl: string,
    @Body('format') format: string,
    @Body('fileSize') fileSize?: number,
  ) {
    return this.coffinService.addModel(id, modelUrl, format, fileSize);
  }

  @Delete(':coffinId/models/:modelId')
  removeModel(@Param('coffinId') coffinId: string, @Param('modelId') modelId: string) {
    return this.coffinService.removeModel(coffinId, modelId);
  }
}
