import { StudentBase, WindowBase } from '../../interfaces';

export interface WindowItem extends WindowBase {
  students: (StudentBase & {
    studentId: number;
    coursemologyName: string;
    numSubmissions: number;
    numInterviews: number;
    exclusion: {
      id: number;
      reason: string; // TODO: Make this an enum
    } | null;
  })[];
}
