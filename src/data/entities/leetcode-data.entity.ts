import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '@prisma/client';

export type LeetCodeData = {
  id: number;
  name: string;
  difficulty: QuestionDifficulty;
  slug: string;
  isPremium: boolean;
  type: QuestionType;
  source: QuestionSource;
}[];
