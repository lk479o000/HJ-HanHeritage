import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { VisitorService } from './visitor.service';
import type { VisitorEventDto } from './visitor.service';

@Public()
@Controller('visitor')
export class VisitorController {
  constructor(private visitorService: VisitorService) {}

  @Get('cliffs')
  findCliffs() {
    return this.visitorService.findCliffs();
  }

  @Get('cliffs/:id')
  findCliff(@Param('id') id: string) {
    return this.visitorService.findCliff(id);
  }

  @Get('coffins')
  findCoffins() {
    return this.visitorService.findCoffins();
  }

  @Get('coffins/:id')
  findCoffin(@Param('id') id: string) {
    return this.visitorService.findCoffin(id);
  }

  @Get('panoramas')
  findPanoramas() {
    return this.visitorService.findPanoramas();
  }

  @Get('panoramas/:id')
  findPanorama(@Param('id') id: string) {
    return this.visitorService.findPanorama(id);
  }

  @Get('notices')
  findNotices(@Query('limit') limit?: string) {
    return this.visitorService.findPublishedNotices(
      limit ? Math.min(parseInt(limit, 10) || 5, 20) : 5,
    );
  }

  @Post('events')
  recordEvent(@Body() dto: VisitorEventDto, @Req() req: any) {
    return this.visitorService.recordEvent(dto, req.ip);
  }
}
