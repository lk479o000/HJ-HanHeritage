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
import { NoticeService } from './notice.service';

@Controller('notices')
export class NoticeController {
  constructor(private noticeService: NoticeService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.noticeService.findAll(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      type,
      status,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticeService.findOne(id);
  }

  @Post()
  create(
    @Body('title') title: string,
    @Body('content') content?: string,
    @Body('contentHtml') contentHtml?: string,
    @Body('type') type?: string,
    @Body('scope') scope?: string,
  ) {
    return this.noticeService.create({ title, content, contentHtml, type: type || 'notice', scope: scope || 'all' });
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body('title') title?: string,
    @Body('content') content?: string,
    @Body('contentHtml') contentHtml?: string,
    @Body('type') type?: string,
    @Body('scope') scope?: string,
  ) {
    return this.noticeService.update(id, { title, content, contentHtml, type, scope });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticeService.remove(id);
  }

  @Put(':id/publish')
  publish(@Param('id') id: string) {
    return this.noticeService.publish(id);
  }

  @Put(':id/draft')
  draft(@Param('id') id: string) {
    return this.noticeService.draft(id);
  }
}
