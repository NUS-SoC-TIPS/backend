import {
  Language,
  Question,
  QuestionDifficulty,
  QuestionSource,
  QuestionSubmission,
  RoomRecord,
  User,
} from '../prisma/generated';

export interface BaseUser {
  name: string;
  githubUsername: string;
  profileUrl: string;
  photoUrl: string;
}

export interface BaseQuestion {
  name: string;
  source: QuestionSource;
  difficulty: QuestionDifficulty;
  slug: string;
}

export interface BaseSubmission {
  id: number;
  submittedAt: Date;
  question: BaseQuestion;
  language: Language;
  codeWritten: string;
}

export interface BaseInterview {
  id: number;
  partner: BaseUser;
  completedAt: Date;
  duration: number;
  language: Language; // Deprecate once replay is introduced
}

export interface SubmissionWithQuestion extends QuestionSubmission {
  question: Question;
}

export interface RecordWithPartner extends RoomRecord {
  partner: User;
  notes: string;
}
