import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('chat')
  chat(
    @Body('message') message: string,
    @Body('history') history?: Array<{ role: string; content: string }>,
  ) {
    return this.aiService.chat(message, history);
  }

  @Post('recognize')
  recognize(@Body('imageUrl') imageUrl: string) {
    return this.aiService.recognize(imageUrl);
  }

  @Get('history')
  getHistory(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.aiService.getHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }
}
