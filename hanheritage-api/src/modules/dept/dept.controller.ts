import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DeptService } from './dept.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('depts')
export class DeptController {
  constructor(private deptService: DeptService) {}

  @Get('tree')
  findTree() {
    return this.deptService.findTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deptService.findOne(id);
  }

  @Roles('SYS_ADMIN')
  @Post()
  create(
    @Body('name') name: string,
    @Body('parentId') parentId?: number,
    @Body('sort') sort?: number,
    @Body('leader') leader?: string,
    @Body('status') status?: number,
  ) {
    return this.deptService.create({ name, parentId, sort, leader, status });
  }

  @Roles('SYS_ADMIN')
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('parentId') parentId?: number,
    @Body('sort') sort?: number,
    @Body('leader') leader?: string,
    @Body('status') status?: number,
  ) {
    return this.deptService.update(id, { name, parentId, sort, leader, status });
  }

  @Roles('SYS_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deptService.remove(id);
  }
}
