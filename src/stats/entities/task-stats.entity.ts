import {
  Question,
  QuestionSubmission,
  RoomRecord,
  User,
  Window,
} from '@prisma/client';

export interface TaskStats {
  windows: {
    window: Window;
    submissions: {
      submission: QuestionSubmission;
      question: Question;
    }[];
    interviews: {
      record: RoomRecord;
      partner: User;
    }[];
  }[];
}
