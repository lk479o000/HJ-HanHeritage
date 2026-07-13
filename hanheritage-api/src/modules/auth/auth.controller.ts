import { Controller, Post, Get, Put, Body, Request, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OnlineUserService } from '../monitor/online-user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private onlineUserService: OnlineUserService,
  ) {}

  @Public()
  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    const ip = req.ip || req.connection?.remoteAddress;
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('logout')
  logout(@CurrentUser('userId') userId: string) {
    this.onlineUserService.removeByUserId(userId);
    return null;
  }

  @Public()
  @Post('refresh')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('userInfo')
  getUserInfo(@CurrentUser('userId') userId: string) {
    return this.authService.getUserInfo(userId);
  }

  @Put('password')
  updatePassword(
    @CurrentUser('userId') userId: string,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.updatePassword(userId, oldPassword, newPassword);
  }
}
