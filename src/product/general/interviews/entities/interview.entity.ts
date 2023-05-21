import { Language } from '../../../../infra/prisma/generated';

export interface InterviewEntity {
  completedAt: Date;
  partner: {
    name: string;
    notes: string;
  };
  codeWritten: string;
  language: Language;
}
