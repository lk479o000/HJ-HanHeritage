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
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';

@Controller('resources')
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('folderId') folderId?: string,
  ) {
    return this.resourceService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      keyword,
      folderId,
    );
  }

  @Get('tree')
  findTree() {
    return this.resourceService.findTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourceService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateResourceDto) {
    return this.resourceService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateResourceDto) {
    return this.resourceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resourceService.remove(id);
  }

  @Put(':id/move')
  move(@Param('id') id: string, @Body('targetParentId') targetParentId: number) {
    return this.resourceService.move(id, targetParentId);
  }
}
