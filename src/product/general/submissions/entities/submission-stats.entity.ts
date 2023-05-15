import { SubmissionWithQuestion } from '../../../../infra/interfaces/interface';

export interface SubmissionStatsEntity {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numberOfSubmissionsForThisWindowOrWeek: number;
  // If this is null, that means the number of submissions is for this week. If it's non-null, then
  // the number of submissions is for this current window.
  numQuestions: number | null;
  latestSubmission: SubmissionWithQuestion | null;
  stats: {
    numEasyCompleted: number;
    numMediumCompleted: number;
    numHardCompleted: number;
  };
  // TODO: Look into paginating the submissions
  allSubmissions: SubmissionWithQuestion[];
}
