import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async chat(message: string, _history?: Array<{ role: string; content: string }>) {
    return {
      reply: `AI assistant placeholder response for: "${message}"`,
      timestamp: new Date().toISOString(),
    };
  }

  async recognize(imageUrl: string) {
    return {
      imageUrl,
      results: [],
      message: 'AI recognition placeholder - not yet configured',
    };
  }

  async getHistory(userId: string, page = 1, pageSize = 10) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      userId,
    };
  }
}
