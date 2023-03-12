import { Injectable } from '@nestjs/common';

import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '../prisma/generated';

import {
  AdminData,
  ConfigData,
  QuestionData,
  StudentData,
  WindowData,
} from './entities';
import {
  adminsJson,
  configJson,
  kattisJson,
  leetCodeJson,
  studentsJson,
  windowsJson,
} from './jsons';

@Injectable()
export class DataService {
  private adminData: AdminData;
  private configData: ConfigData;
  private leetCodeData: QuestionData;
  private kattisData: QuestionData;
  private windowData: WindowData;
  private studentData: StudentData;

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
    this.windowData = windowsJson.map((w) => ({
      ...w,
      startAt: new Date(w.startAt),
      endAt: new Date(w.endAt),
    }));
    this.studentData = studentsJson.map((s) => ({
      ...s,
      coursemologyProfile: `${this.configData.coursemology}/users/${s.id}`,
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

  getWindowData(): WindowData {
    return this.windowData;
  }

  getStudentData(): StudentData {
    return this.studentData;
  }
}
