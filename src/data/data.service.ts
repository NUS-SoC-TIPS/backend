import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Question,
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
  Window,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import config from './config.json';
import { ConfigData, LeetCodeData, WindowData } from './entities';
import leetcode from './leetcode.json';
import windows from './windows.json';

@Injectable()
export class DataService implements OnModuleInit {
  private configData: ConfigData;
  private leetCodeData: LeetCodeData[];
  private windowData: WindowData[];

  constructor(private readonly prismaService: PrismaService) {
    this.configData = config;
    this.leetCodeData = leetcode.map((l) => ({
      ...l,
      difficulty: QuestionDifficulty[l.difficulty],
      type: QuestionType[l.type],
      source: QuestionSource.LEETCODE,
    }));
    this.windowData = windows.map((w) => ({
      ...w,
      startAt: new Date(w.startAt),
      endAt: new Date(w.endAt),
    }));
  }

  async onModuleInit(): Promise<void> {
    await this.seedWindows();
    await this.seedLeetCode();
  }

  getConfigData(): ConfigData {
    return this.configData;
  }

  getLeetCodeData(): LeetCodeData[] {
    return this.leetCodeData;
  }

  getWindowData(): WindowData[] {
    return this.windowData;
  }

  private seedWindows(): Promise<Window[]> {
    return Promise.all(
      this.windowData.map((window) => {
        const { id, ...windowData } = window;
        return this.prismaService.window.upsert({
          create: {
            ...window,
          },
          update: {
            ...windowData,
          },
          where: {
            id,
          },
        });
      }),
    );
  }

  private seedLeetCode(): Promise<Question[]> {
    return Promise.all(
      this.leetCodeData.map((question) => {
        const { slug, source, ...questionData } = question;
        return this.prismaService.question.upsert({
          create: {
            ...question,
          },
          update: {
            ...questionData,
          },
          where: {
            slug_source: {
              slug,
              source,
            },
          },
        });
      }),
    );
  }
}
