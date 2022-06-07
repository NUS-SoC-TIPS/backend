import { Injectable } from '@nestjs/common';
import { RoomRecord, RoomRecordUser, User } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { MINIMUM_INTERVIEW_DURATION } from '../records.constants';

interface Where {
  where: {
    roomRecordUsers?: {
      some: {
        userId: string;
        isInterviewer: false;
      };
    };
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
    duration: {
      gte: number;
    };
  };
}

interface OrderBy {
  orderBy?: {
    createdAt: 'desc';
  };
}

interface Include {
  include: {
    roomRecordUsers: {
      include: {
        user: true;
      };
    };
  };
}

interface RecordsQueryResult extends RoomRecord {
  roomRecordUsers: (RoomRecordUser & { user: User })[];
  partner?: User;
  notes?: string;
}

@Injectable()
export class RecordsQueryBuilder {
  private userId: string | null = null;
  private before: Date | null = null;
  private after: Date | null = null;
  private latestFirst = false;

  constructor(private readonly prismaService: PrismaService) {}

  reset(): this {
    this.userId = this.before = this.after = null;
    this.latestFirst = false;
    return this;
  }

  forUser(userId: string): this {
    this.userId = userId;
    return this;
  }

  createdBefore(before: Date | undefined): this {
    this.before = before ?? null;
    return this;
  }

  createdAfter(after: Date | undefined): this {
    this.after = after ?? null;
    return this;
  }

  withLatestFirst(): this {
    this.latestFirst = true;
    return this;
  }

  async count(): Promise<number> {
    const records = await this.prismaService.roomRecord.findMany({
      ...this.getWhere(),
      include: {
        roomRecordUsers: true,
      },
    });
    return this.filterValidRecords(records).length;
  }

  async latest(): Promise<RecordsQueryResult | null> {
    const records = await this.prismaService.roomRecord.findMany({
      ...this.getWhere(),
      ...this.getInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });
    const validRecords = this.filterValidRecords(records);
    if (validRecords.length === 0) {
      return null;
    }
    return this.transformRecords([validRecords[0]])[0];
  }

  async query(): Promise<RecordsQueryResult[]> {
    const records = await this.prismaService.roomRecord.findMany({
      ...this.getWhere(),
      ...this.getInclude(),
      ...this.getOrderBy(),
    });
    return this.transformRecords(this.filterValidRecords(records));
  }

  private filterValidRecords<
    A extends RoomRecord & { roomRecordUsers: RoomRecordUser[] },
  >(records: A[]): A[] {
    return records.filter((record) => record.roomRecordUsers.length === 2);
  }

  private transformRecords(
    records: RecordsQueryResult[],
  ): RecordsQueryResult[] {
    if (!this.userId) {
      return records;
    }
    return records.map((record) => {
      const { roomRecordUsers, ...recordData } = record;
      const partnerRoomUser = roomRecordUsers.filter(
        (recordUser) => recordUser.userId !== this.userId,
      )[0];
      return {
        ...recordData,
        roomRecordUsers,
        partner: partnerRoomUser.user,
        notes: partnerRoomUser.notes,
      };
    });
  }

  private getWhere(): Where {
    return {
      where: {
        ...(this.userId
          ? {
              roomRecordUsers: {
                some: {
                  userId: this.userId,
                  isInterviewer: false,
                },
              },
            }
          : {}),
        ...(this.before || this.after
          ? {
              createdAt: {
                ...(this.after ? { gte: this.after } : {}),
                ...(this.before ? { lte: this.before } : {}),
              },
            }
          : {}),
        duration: {
          gte: MINIMUM_INTERVIEW_DURATION,
        },
      },
    };
  }

  private getOrderBy(): OrderBy {
    return this.latestFirst ? { orderBy: { createdAt: 'desc' } } : {};
  }

  private getInclude(): Include {
    return { include: { roomRecordUsers: { include: { user: true } } } };
  }
}
