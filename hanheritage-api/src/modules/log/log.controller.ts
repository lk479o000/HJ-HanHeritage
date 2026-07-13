import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { LogService } from './log.service';
import { DeleteOperationLogsDto } from './dto/delete-operation-logs.dto';

@Controller('logs')
export class LogController {
  constructor(private logService: LogService) {}

  @Get('login')
  findLoginLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('username') username?: string,
  ) {
    return this.logService.findLoginLogs(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
      username,
    );
  }

  /** @deprecated 兼容旧路径，请使用 GET /logs/operations */
  @Get('operation')
  findOperationLogsLegacy(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.findOperationLogs(page, pageSize, keyword, startTime, endTime);
  }

  @Get('operations')
  findOperationLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.logService.findOperationLogs({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 10,
      keyword,
      startTime,
      endTime,
    });
  }

  @Get('operations/export')
  exportOperationLogs(
    @Query('keyword') keyword?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.logService.exportOperationLogs({ keyword, startTime, endTime });
  }

  @Delete('operations/clear')
  clearOperationLogs() {
    return this.logService.clearOperationLogs();
  }

  @Delete('operations/batch')
  deleteOperationLogs(@Body() dto: DeleteOperationLogsDto) {
    return this.logService.deleteOperationLogs(dto.ids);
  }

  @Delete('operations/:id')
  deleteOperationLog(@Param('id') id: string) {
    return this.logService.deleteOperationLog(id);
  }

  @Delete('login/batch')
  deleteLoginLogs(@Body() dto: DeleteOperationLogsDto) {
    return this.logService.deleteLoginLogs(dto.ids);
  }

  @Delete('login/clear')
  clearLoginLogs() {
    return this.logService.clearLoginLogs();
  }

  @Delete('login/:id')
  deleteLoginLog(@Param('id') id: string) {
    return this.logService.deleteLoginLog(id);
  }
}
