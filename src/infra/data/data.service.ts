import { Injectable } from '@nestjs/common';

import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '../prisma/generated';

import { AdminData, QuestionData } from './entities';
import { adminsJson, kattisJson, leetCodeJson } from './jsons';

@Injectable()
export class DataService {
  private adminData: AdminData;
  private leetCodeData: QuestionData;
  private kattisData: QuestionData;

  constructor() {
    this.adminData = adminsJson;
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

  getLeetCodeData(): QuestionData {
    return this.leetCodeData;
  }

  getKattisData(): QuestionData {
    return this.kattisData;
  }
}
