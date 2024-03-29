import {
  QuestionDifficulty,
  QuestionSource,
  QuestionType,
} from '../../prisma/generated';

export type QuestionData = {
  id: number;
  name: string;
  difficulty: QuestionDifficulty;
  slug: string;
  isPremium: boolean;
  type: QuestionType;
  source: QuestionSource;
}[];
