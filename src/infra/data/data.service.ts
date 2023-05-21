import { Injectable } from '@nestjs/common';

import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '../prisma/generated';

import { AdminData, ConfigData, QuestionData } from './entities';
import { adminsJson, configJson, kattisJson, leetCodeJson } from './jsons';

@Injectable()
export class DataService {
  private adminData: AdminData;
  private configData: ConfigData;
  private leetCodeData: QuestionData;
  private kattisData: QuestionData;

  constructor() {
    this.adminData = adminsJson;
    this.configData = configJson;
    this.leetCodeData = leetCodeJson.map((l) => ({
      ...l,
      difficulty: QuestionDifficulty[l.difficulty],
      type: QuestionType[l.type],
      source: QuestionSource.LEETCODE,
    }));
    this.kattisData = kattisJson.map((k) => ({
      ...k,
      difficulty: QuestionDifficulty[k.difficulty],
      type: QuestionType[k.type],
      source: QuestionSource.KATTIS,
    }));
  }

  getAdminData(): AdminData {
    return this.adminData;
  }

  getConfigData(): ConfigData {
    return this.configData;
  }

  getLeetCodeData(): QuestionData {
    return this.leetCodeData;
  }

  getKattisData(): QuestionData {
    return this.kattisData;
  }
}
