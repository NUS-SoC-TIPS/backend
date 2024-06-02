import { Injectable, Logger } from '@nestjs/common';
import { generateSlug } from 'random-word-slugs';

import { DateService } from '../../../infra/date/date.service';
import {
  Room,
  RoomStatus,
  RoomUser,
  Window,
} from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CurrentService } from '../../../productinfra/current/current.service';
import {
  InterviewItem,
  InterviewListItem,
  makeInterviewItem,
  makeInterviewListItem,
  makeStudentBase,
  StudentBase,
} from '../../interfaces';

import {
  InterviewStats,
  InterviewStatsProgress,
} from './interviews.interfaces';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly logger: Logger,
    private readonly dateService: DateService,
    private readonly prismaService: PrismaService,
    private readonly currentService: CurrentService,
  ) {}

  async findStats(userId: string): Promise<InterviewStats> {
    let progress: InterviewStatsProgress;
    let pairedPartner: StudentBase | null = null;

    const ongoingWindow = await this.currentService.findOngoingWindow();
    if (ongoingWindow != null) {
      const student = await this.prismaService.student.findUnique({
        where: {
          userId_cohortId: { userId, cohortId: ongoingWindow.cohortId },
        },
      });
      if (student != null) {
        progress = await this.findWindowProgress(student.id, ongoingWindow);
        pairedPartner = await this.findPairedPartner(
          student.id,
          ongoingWindow.id,
        );
      } else {
        progress = await this.findWeekProgress(userId);
      }
    } else {
      progress = await this.findWeekProgress(userId);
    }

    const averageDurationMs = await this.findAverageDurationMs(userId);
    return { progress, averageDurationMs, pairedPartner };
  }

  async findInterviews(userId: string): Promise<InterviewListItem[]> {
    const roomRecords = await this.prismaService.roomRecord.findMany({
      where: { isValid: true, roomRecordUsers: { some: { userId } } },
      include: { roomRecordUsers: { include: { user: true } }, room: true },
      orderBy: { room: { closedAt: 'desc' } },
    });
    return roomRecords.map((roomRecord) =>
      makeInterviewListItem(roomRecord, userId),
    );
  }

  async findInterview(id: number, userId: string): Promise<InterviewItem> {
    const roomRecord = await this.prismaService.roomRecord.findFirst({
      where: { id, isValid: true, roomRecordUsers: { some: { userId } } },
      include: { roomRecordUsers: { include: { user: true } }, room: true },
    });
    if (roomRecord?.room.closedAt == null) {
      this.logger.error(
        'Invalid interview accessed',
        undefined,
        InterviewsService.name,
      );
      throw new Error('Invalid interview accessed');
    }
    return makeInterviewItem(roomRecord, userId);
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
    // Incorrect lint, without this disable it flags out all optional chaining after the first one
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return (await this.findCurrentRoomUser(userId))?.room?.slug ?? null;
  }

  private async findWindowProgress(
    studentId: number,
    window: Window,
  ): Promise<InterviewStatsProgress> {
    const studentResultWithInterviewCount =
      await this.prismaService.studentResult.findFirst({
        where: { studentId, windowId: window.id },
        include: { _count: { select: { roomRecordUsers: true } } },
      });
    return {
      numInterviewsThisWindowOrWeek:
        // Incorrect lint, without this disable it flags out all optional chaining after the first one
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        studentResultWithInterviewCount?._count?.roomRecordUsers ?? 0,
      isInterviewRequired: window.requireInterview,
      startOfWindowOrWeek: window.startAt,
      endOfWindowOrWeek: window.endAt,
      isWindow: true,
    };
  }

  private async findWeekProgress(
    userId: string,
  ): Promise<InterviewStatsProgress> {
    const startOfWeek = this.dateService.findStartOfWeek();
    const endOfWeek = this.dateService.findEndOfWeek();
    const numInterviewsThisWeek = await this.prismaService.roomRecord.count({
      where: {
        isValid: true,
        roomRecordUsers: { some: { userId } },
        room: { closedAt: { gte: startOfWeek, lte: endOfWeek } },
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

  private async findPairedPartner(
    studentId: number,
    windowId: number,
  ): Promise<StudentBase | null> {
    const pairing = await this.prismaService.pairing.findFirst({
      where: { windowId, pairingStudents: { some: { studentId } } },
      include: {
        pairingStudents: { include: { student: { include: { user: true } } } },
      },
    });
    // Incorrect lint, without this disable it flags out all optional chaining after the first one
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const partnerStudent = pairing?.pairingStudents?.filter(
      (pairingStudent) => pairingStudent.studentId !== studentId,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    )?.[0]?.student;
    return partnerStudent != null ? makeStudentBase(partnerStudent) : null;
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
