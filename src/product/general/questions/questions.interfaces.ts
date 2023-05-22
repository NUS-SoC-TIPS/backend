export interface QuestionStatsProgress {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numSubmissionsThisWindowOrWeek: number;
  numSubmissionsRequired: number | null; // null if not for window
  startOfWindowOrWeek: Date;
  endOfWindowOrWeek: Date;
  isWindow: boolean;
}

export interface QuestionStatsDifficultyBreakdown {
  numEasy: number;
  numMedium: number;
  numHard: number;
}

export type QuestionStatsLanguageBreakdown = {
  // Keys are values of the Language enum
  [language: string]: string;
};

export interface QuestionStats {
  progress: QuestionStatsProgress;
  // Potentially can reuse for the table
  difficultyBreakdown: QuestionStatsDifficultyBreakdown;
  // Potentially can reuse for the table
  languageBreakdown: QuestionStatsLanguageBreakdown;
}
