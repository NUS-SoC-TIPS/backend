import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '@prisma/client';

export interface LeetCodeData {
  id: number;
  name: string;
  difficulty: QuestionDifficulty;
  slug: string;
  isPremium: boolean;
  type: QuestionType;
  source: QuestionSource;
}
