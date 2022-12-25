import { Exclusion, User, Window } from '@prisma/client';

import {
  RecordWithPartner,
  SubmissionWithQuestion,
} from '../../interfaces/interface';

export interface UserWithWindowData extends User {
  coursemologyName: string;
  coursemologyEmail: string;
  coursemologyProfileLink: string;
  submissions: SubmissionWithQuestion[];
  records: RecordWithPartner[];
  hasCompletedWindow: boolean;
}

export interface ExcludedUserWithWindowData extends UserWithWindowData {
  exclusion: Exclusion;
}

// If a user joins only in window 2, they will be present in
// window 2's stats but under "yet to join" in window 1.
export interface AdminStatsEntity extends Window {
  numberOfStudents: number; // Number of students who are on the platform by the end of the window
  numberOfCompletedStudents: number; // Number of students who have completed the targets
  averageNumberOfQuestions: number; // Average number of questions attempted by the students
  students: UserWithWindowData[];
  excludedStudents: ExcludedUserWithWindowData[];
  nonStudents: UserWithWindowData[];
}
