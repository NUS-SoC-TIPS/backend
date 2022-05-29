import { Injectable } from '@nestjs/common';
import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '@prisma/client';

import { AdminData, ConfigData, LeetCodeData, WindowData } from './entities';
import { adminsJson, configJson, leetCodeJson, windowsJson } from './jsons';

@Injectable()
export class DataService {
  private adminData: AdminData;
  private configData: ConfigData;
  private leetCodeData: LeetCodeData;
  private windowData: WindowData;

  constructor() {
    this.adminData = adminsJson;
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

  getAdminData(): AdminData {
    return this.adminData;
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
