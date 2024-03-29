import { UserBase } from '../interfaces';

export interface AdminOverview {
  cohorts: {
    id: number;
    name: string;
    numStudents: number;
    startAt: Date | null;
    endAt: Date | null;
  }[];
  // TODO: Think about whether we want to paginate the list of non-students
  nonStudents: (UserBase & {
    joinedAt: Date;
  })[];
}
