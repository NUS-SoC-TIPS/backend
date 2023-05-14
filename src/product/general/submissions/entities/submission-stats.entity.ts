import { SubmissionWithQuestion } from '../../../../infra/interfaces/interface';

export interface SubmissionStatsEntity {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numberOfSubmissionsForThisWindowOrWeek: number;
  isWindow: boolean; // Whether the number of submissions is for on ongoing window (else it'd be for this current week)
  latestSubmission: SubmissionWithQuestion | null;
  stats: {
    numEasyCompleted: number;
    numMediumCompleted: number;
    numHardCompleted: number;
  };
  // TODO: Look into paginating the submissions
  allSubmissions: SubmissionWithQuestion[];
}
