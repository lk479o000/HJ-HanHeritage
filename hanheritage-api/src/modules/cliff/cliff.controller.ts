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
import { CliffService } from './cliff.service';
import { CreateCliffDto } from './dto/create-cliff.dto';
import { CreateEntranceDto } from './dto/create-entrance.dto';

@Controller('cliffs')
export class CliffController {
  constructor(private cliffService: CliffService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.cliffService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      keyword,
    );
  }

  @Get('entrances')
  findEntrances(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.cliffService.findEntrances(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  @Put('entrances/:id')
  updateEntrance(@Param('id') id: string, @Body() dto: CreateEntranceDto) {
    return this.cliffService.updateEntrance(id, dto);
  }

  @Delete('entrances/:id')
  deleteEntrance(@Param('id') id: string) {
    return this.cliffService.deleteEntrance(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cliffService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCliffDto) {
    return this.cliffService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: CreateCliffDto) {
    return this.cliffService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cliffService.remove(id);
  }

  @Post(':id/entrances')
  addEntrance(@Param('id') id: string, @Body() dto: CreateEntranceDto) {
    return this.cliffService.addEntrance(id, dto);
  }

  @Delete(':cliffId/entrances/:entranceId')
  removeEntrance(@Param('cliffId') cliffId: string, @Param('entranceId') entranceId: string) {
    return this.cliffService.removeEntrance(cliffId, entranceId);
  }
}
