import { Injectable, Logger } from '@nestjs/common';
import { generateSlug } from 'random-word-slugs';

import {
  Room,
  RoomStatus,
  RoomUser,
  Window,
} from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CurrentService } from '../../../productinfra/current/current.service';
import { findEndOfWeek, findStartOfWeek } from '../../../utils';
import {
  InterviewItem,
  makeUserBase,
  StudentBase,
  UserBase,
} from '../../interfaces';

import { InterviewStatsEntity, InterviewStatsProgressEntity } from './entities';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly currentService: CurrentService,
  ) {}

  async findStats(userId: string): Promise<InterviewStatsEntity> {
    const progress = await this.findProgress(userId);
    const averageDurationMs = await this.findAverageDurationMs(userId);
    const pairedOrLatestPartner = await this.findPairedOrLatestPartner(userId);
    return { progress, averageDurationMs, pairedOrLatestPartner };
  }

  async findInterview(id: number, userId: string): Promise<InterviewItem> {
    const roomRecord = await this.prismaService.roomRecord.findFirst({
      where: { id, isValid: true, roomRecordUsers: { some: { userId } } },
      include: { roomRecordUsers: { include: { user: true } }, room: true },
    });
    if (roomRecord == null || roomRecord.room.closedAt == null) {
      this.logger.error(
        'Invalid interview accessed',
        undefined,
        InterviewsService.name,
      );
      throw new Error('Invalid interview accessed');
    }
    const partner = roomRecord.roomRecordUsers.filter(
      (u) => u.userId !== userId,
    )[0];
    return {
      completedAt: roomRecord.room.closedAt,
      partner: { name: partner.user.name, notes: partner.notes },
      codeWritten: roomRecord.codeWritten,
      language: roomRecord.language,
    };
  }

  async createRoom(userId: string): Promise<string> {
    const currentRoomUser = await this.findCurrentRoomUser(userId);
    if (currentRoomUser) {
      this.logger.error(
        'Failed to create room as user is already in an open room',
        undefined,
        InterviewsService.name,
      );
      throw new Error('User is already in an open room');
    }

    return (
      await this.prismaService.room.create({
        data: {
          slug: await this.generateRoomSlug(),
          roomUsers: { create: { userId } },
        },
      })
    ).slug;
  }

  async findCurrentRoom(userId: string): Promise<string | null> {
    return (await this.findCurrentRoomUser(userId))?.room?.slug ?? null;
  }

  private async findProgress(
    userId: string,
  ): Promise<InterviewStatsProgressEntity> {
    const ongoingWindow = await this.currentService.findOngoingWindow();
    if (ongoingWindow != null) {
      return this.findWindowProgress(userId, ongoingWindow);
    }
    return this.findWeekProgress(userId);
  }

  private async findWindowProgress(
    userId: string,
    window: Window,
  ): Promise<InterviewStatsProgressEntity> {
    const studentResultWithInterviewCount =
      await this.prismaService.studentResult.findFirst({
        where: {
          student: { userId, cohortId: window.cohortId },
          windowId: window.id,
        },
        include: { _count: { select: { roomRecordUsers: true } } },
      });
    return {
      numInterviewsThisWindowOrWeek:
        studentResultWithInterviewCount?._count?.roomRecordUsers ?? 0,
      isInterviewRequired: window.requireInterview,
      startOfWindowOrWeek: window.startAt,
      endOfWindowOrWeek: window.endAt,
      isWindow: true,
    };
  }

  private async findWeekProgress(
    userId: string,
  ): Promise<InterviewStatsProgressEntity> {
    const startOfWeek = findStartOfWeek();
    const endOfWeek = findEndOfWeek();
    const numInterviewsThisWeek = await this.prismaService.roomRecord.count({
      where: {
        isValid: true,
        roomRecordUsers: { some: { userId } },
        createdAt: { gte: startOfWeek, lte: endOfWeek },
      },
    });
    return {
      numInterviewsThisWindowOrWeek: numInterviewsThisWeek,
      isInterviewRequired: null,
      startOfWindowOrWeek: startOfWeek,
      endOfWindowOrWeek: endOfWeek,
      isWindow: false,
    };
  }

  private async findAverageDurationMs(userId: string): Promise<number> {
    const roomRecordAggregate = await this.prismaService.roomRecord.aggregate({
      where: { roomRecordUsers: { some: { userId } }, isValid: true },
      _avg: { duration: true },
    });
    return roomRecordAggregate._avg.duration ?? 0;
  }

  private async findPairedOrLatestPartner(
    userId: string,
  ): Promise<UserBase | StudentBase | null> {
    // We don't have pairing as of now, so we'll just return the latest partner
    const latestRoomRecord = await this.prismaService.roomRecord.findFirst({
      where: { roomRecordUsers: { some: { userId } }, isValid: true },
      orderBy: { createdAt: 'desc' },
      include: { roomRecordUsers: { include: { user: true } } },
    });
    const latestPartnerUser = latestRoomRecord?.roomRecordUsers?.filter(
      (u) => u.userId !== userId,
    )[0].user;
    return latestPartnerUser != null ? makeUserBase(latestPartnerUser) : null;
  }

  /**
   * Finds the active room user for the user, and also returns the room.
   */
  private findCurrentRoomUser(
    userId: string,
  ): Promise<(RoomUser & { room: Room }) | null> {
    return this.prismaService.roomUser.findFirst({
      where: { userId, room: { status: RoomStatus.OPEN } },
      include: { room: true },
    });
  }

  private async generateRoomSlug(): Promise<string> {
    let slug: string;
    let existingRoom: Room | null;

    do {
      slug = generateSlug();
      existingRoom = await this.prismaService.room.findFirst({
        where: { slug, status: RoomStatus.OPEN },
      });
    } while (existingRoom != null);

    return slug;
  }
}
