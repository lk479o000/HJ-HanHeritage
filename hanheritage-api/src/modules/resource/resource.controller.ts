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
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import {
  assertUploadedFile,
  createUploadOptions,
  resolveResourceCategory,
  sanitizeOriginalName,
} from '../../common/upload/upload-policy';

@Controller('resources')
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('folderId') folderId?: string,
    @Query('type') type?: string,
  ) {
    return this.resourceService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      keyword,
      folderId,
      type,
    );
  }

  @Get('tree')
  findTree() {
    return this.resourceService.findTree();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', createUploadOptions()))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folderId') folderId?: string,
    @Body('type') type?: string,
    @Body('remark') remark?: string,
  ) {
    if (!file) {
      throw new BadRequestException('请选择要上传的文件');
    }
    const category = resolveResourceCategory(type, file.originalname);
    assertUploadedFile(file, category);

    let name = file.originalname || '未命名文件';
    try {
      name = Buffer.from(name, 'latin1').toString('utf8');
    } catch {
      /* 保持原文件名 */
    }
    name = sanitizeOriginalName(name);
    return this.resourceService.create({
      name,
      type: type || 'doc',
      parentId: folderId ? Number(folderId) : 0,
      fileUrl: `/uploads/${file.filename}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      remark,
    });
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

  @Delete('batch')
  removeBatch(@Body('ids') ids: string[]) {
    return this.resourceService.removeBatch(ids);
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
