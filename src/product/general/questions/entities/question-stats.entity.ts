export interface QuestionStatsProgressEntity {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numSubmissionsThisWindowOrWeek: number;
  numSubmissionsRequired: number | null; // null if not for window
  startOfWindowOrWeek: Date;
  endOfWindowOrWeek: Date;
  isWindow: boolean;
}

export interface QuestionStatsDifficultyBreakdownEntity {
  numEasy: number;
  numMedium: number;
  numHard: number;
}

export type QuestionStatsLanguageBreakdownEntity = {
  // Keys are values of the Language enum
  [language: string]: string;
};

export interface QuestionStatsEntity {
  progress: QuestionStatsProgressEntity;
  // Potentially can reuse for the table
  difficultyBreakdown: QuestionStatsDifficultyBreakdownEntity;
  // Potentially can reuse for the table
  languageBreakdown: QuestionStatsLanguageBreakdownEntity;
}
