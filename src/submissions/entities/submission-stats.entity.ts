import { Window } from '@prisma/client';

import { SubmissionWithQuestion } from '../../interfaces/interface';

export interface SubmissionStatsEntity {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numberOfSubmissionsForThisWindowOrWeek: number;
  latestSubmission: SubmissionWithQuestion | null;
  // TODO: Look into replacing this with something more meaningful
  closestWindow: Window;
  allSubmissions: SubmissionWithQuestion[];
}
