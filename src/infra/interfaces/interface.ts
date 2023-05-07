import {
  Question,
  QuestionSubmission,
  RoomRecord,
  User,
} from '../prisma/generated';

export interface SubmissionWithQuestion extends QuestionSubmission {
  question: Question;
}

export interface RecordWithPartner extends RoomRecord {
  partner: User;
  notes: string;
}
