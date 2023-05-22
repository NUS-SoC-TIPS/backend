import { Language, QuestionSource } from '../../../infra/prisma/generated';

interface CreateRoomRecordUserData {
  userId: string;
  isInterviewer: boolean;
  notes: string;
}

export interface CreateRecordData {
  isRoleplay: boolean;
  duration: number;
  roomId: number;
  language: Language;
  codeWritten: string;
  isSolved?: boolean;
  questionId?: string;
  questionSource?: QuestionSource;
  roomRecordUsers: CreateRoomRecordUserData[];
}

export interface CreateRoomUserData {
  userId: string;
  roomId: number;
}
