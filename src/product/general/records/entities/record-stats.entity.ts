import { RecordWithPartner } from '../../../../infra/interfaces/interface';

export interface RecordStatsEntity {
  // If currently in the middle of a window, the number will be returned
  // Else if not, it will be the number completed this week, with respect to SG time.
  numberOfRecordsForThisWindowOrWeek: number;
  isWindow: boolean; // Whether the number of submissions is for on ongoing window (else it'd be for this current week)
  latestRecord: RecordWithPartner | null;
  averageInterviewDurationMs: number; // In milliseconds, as the name suggests
  allRecords: RecordWithPartner[];
}
