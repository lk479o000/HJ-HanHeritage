import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { PostService } from './post.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Roles('SYS_ADMIN')
  @Post()
  create(
    @Body('name') name: string,
    @Body('code') code: string,
    @Body('parentId') parentId?: string | null,
    @Body('sort') sort?: number,
    @Body('remark') remark?: string,
    @Body('status') status?: number,
    @Body('permissionIds') permissionIds?: string[],
  ) {
    return this.postService.create({ name, code, parentId: parentId ? Number(parentId) : null, sort, remark, status, permissionIds });
  }

  @Roles('SYS_ADMIN')
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('code') code?: string,
    @Body('parentId') parentId?: string | null,
    @Body('sort') sort?: number,
    @Body('remark') remark?: string,
    @Body('status') status?: number,
    @Body('permissionIds') permissionIds?: string[],
  ) {
    return this.postService.update(id, { name, code, parentId: parentId ? Number(parentId) : null, sort, remark, status, permissionIds });
  }

  @Roles('SYS_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
