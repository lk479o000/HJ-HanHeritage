import { Controller, Get, Delete, Query, Param } from '@nestjs/common';
import { MonitorService } from './monitor.service';

@Controller('monitor')
export class MonitorController {
  constructor(private monitorService: MonitorService) {}

  @Get('server')
  getServerInfo() {
    return this.monitorService.getServerInfo();
  }

  @Get('online-users')
  getOnlineUsers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    return this.monitorService.getOnlineUsers(parseInt(page, 10), parseInt(pageSize, 10));
  }

  @Delete('online/:id')
  forceLogout(@Param('id') id: string) {
    return this.monitorService.forceLogout(id);
  }

  @Get('redis')
  getRedisInfo() {
    return this.monitorService.getRedisInfo();
  }
}
