import { Injectable } from '@nestjs/common';
import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '@prisma/client';

import { ConfigData, LeetCodeData, WindowData } from './entities';
import { configJson, leetCodeJson, windowsJson } from './jsons';

@Injectable()
export class DataService {
  private configData: ConfigData;
  private leetCodeData: LeetCodeData;
  private windowData: WindowData;

  constructor() {
    this.configData = configJson;
    this.leetCodeData = leetCodeJson.map((l) => ({
      ...l,
      difficulty: QuestionDifficulty[l.difficulty],
      type: QuestionType[l.type],
      source: QuestionSource.LEETCODE,
    }));
    this.windowData = windowsJson.map((w) => ({
      ...w,
      startAt: new Date(w.startAt),
      endAt: new Date(w.endAt),
    }));
  }

  getConfigData(): ConfigData {
    return this.configData;
  }

  getLeetCodeData(): LeetCodeData {
    return this.leetCodeData;
  }

  getWindowData(): WindowData {
    return this.windowData;
  }
}
