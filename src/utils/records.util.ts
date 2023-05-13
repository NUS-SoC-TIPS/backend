import { RecordWithPartner } from '../infra/interfaces/interface';
import { RoomRecord, RoomRecordUser, User } from '../infra/prisma/generated';

export const transformRoomRecord = (
  roomRecord: RoomRecord & {
    roomRecordUsers: (RoomRecordUser & { user: User })[];
  },
  userId: string,
): RecordWithPartner => {
  const { roomRecordUsers, ...recordData } = roomRecord;
  const partnerRoomUser = roomRecordUsers.filter(
    (recordUser) => recordUser.userId !== userId,
  )[0];
  return {
    ...recordData,
    partner: partnerRoomUser.user,
    notes: partnerRoomUser.notes,
  };
};
