import { Language, QuestionSource } from '../../../../infra/prisma/generated';

interface CreateRoomRecordUserEntity {
  userId: string;
  isInterviewer: boolean;
  notes: string;
}

export interface CreateRecordEntity {
  isRoleplay: boolean;
  duration: number;
  roomId: number;
  language: Language;
  codeWritten: string;
  isSolved?: boolean;
  questionId?: string;
  questionSource?: QuestionSource;
  roomRecordUsers: CreateRoomRecordUserEntity[];
}
