import { Injectable } from '@nestjs/common';
import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '@prisma/client';

import {
  AdminData,
  ConfigData,
  LeetCodeData,
  StudentData,
  WindowData,
} from './entities';
import {
  adminsJson,
  configJson,
  leetCodeJson,
  studentsJson,
  windowsJson,
} from './jsons';

@Injectable()
export class DataService {
  private adminData: AdminData;
  private configData: ConfigData;
  private leetCodeData: LeetCodeData;
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

  getLeetCodeData(): LeetCodeData {
    return this.leetCodeData;
  }

  getWindowData(): WindowData {
    return this.windowData;
  }

  getStudentData(): StudentData {
    return this.studentData;
  }
}
