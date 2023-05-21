import { Language } from '../../infra/prisma/generated';

import { makeUserBase, UserBase } from './users';

// This is the minimal information needed by the frontend to
// render the interview card element (with a clickable link)
export interface InterviewBase {
  id: number;
  partner: UserBase;
}

export interface InterviewListItem extends InterviewBase {
  completedAt: Date;
  duration: number;
  language: Language; // Deprecate once replay is introduced
}

// Completely different because of how the current UI is designed.
// To be reworked once replay is introduced
export interface InterviewItem {
  completedAt: Date;
  partner: {
    name: string;
    notes: string;
  };
  codeWritten: string;
  language: Language;
}

export const makeInterviewBase = (
  roomRecord: {
    id: number;
    roomRecordUsers: {
      userId: string;
      user: {
        name: string;
        githubUsername: string;
        profileUrl: string;
        photoUrl: string;
      };
    }[];
  },
  userId: string,
): InterviewBase => {
  const partnerUser = roomRecord.roomRecordUsers.filter(
    (roomRecordUser) => roomRecordUser.userId !== userId,
  )[0].user;
  return {
    id: roomRecord.id,
    partner: makeUserBase(partnerUser),
  };
};

export const makeInterviewListItem = (
  roomRecord: {
    id: number;
    duration: number;
    language: Language;
    roomRecordUsers: {
      userId: string;
      user: {
        name: string;
        githubUsername: string;
        profileUrl: string;
        photoUrl: string;
      };
    }[];
    room: { closedAt: Date };
  },
  userId: string,
): InterviewListItem => {
  return {
    ...makeInterviewBase(roomRecord, userId),
    completedAt: roomRecord.room.closedAt,
    duration: roomRecord.duration,
    language: roomRecord.language,
  };
};

export const makeInterviewItem = (
  roomRecord: {
    id: number;
    language: Language;
    codeWritten: string;
    roomRecordUsers: {
      userId: string;
      notes: string;
      user: {
        name: string;
      };
    }[];
    room: { closedAt: Date };
  },
  userId: string,
): InterviewItem => {
  const partnerRoomRecordUser = roomRecord.roomRecordUsers.filter(
    (roomRecordUser) => roomRecordUser.userId !== userId,
  )[0];
  return {
    completedAt: roomRecord.room.closedAt,
    partner: {
      name: partnerRoomRecordUser.user.name,
      notes: partnerRoomRecordUser.notes,
    },
    codeWritten: roomRecord.codeWritten,
    language: roomRecord.language,
  };
};
