import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { DeptModule } from './modules/dept/dept.module';
import { MenuModule } from './modules/menu/menu.module';
import { PostModule } from './modules/post/post.module';
import { CliffModule } from './modules/cliff/cliff.module';
import { CoffinModule } from './modules/coffin/coffin.module';
import { PanoramaModule } from './modules/panorama/panorama.module';
import { ResourceModule } from './modules/resource/resource.module';
import { NoticeModule } from './modules/notice/notice.module';
import { LogModule } from './modules/log/log.module';
import { MonitorModule } from './modules/monitor/monitor.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    MonitorModule,
    AuthModule,
    UserModule,
    RoleModule,
    DeptModule,
    MenuModule,
    PostModule,
    CliffModule,
    CoffinModule,
    PanoramaModule,
    ResourceModule,
    NoticeModule,
    LogModule,
    AiModule,
  ],
})
export class AppModule {}
