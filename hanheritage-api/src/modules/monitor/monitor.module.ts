import { Module, Global } from '@nestjs/common';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';
import { OnlineUserService } from './online-user.service';

@Global()
@Module({
  controllers: [MonitorController],
  providers: [MonitorService, OnlineUserService],
  exports: [MonitorService, OnlineUserService],
})
export class MonitorModule {}
