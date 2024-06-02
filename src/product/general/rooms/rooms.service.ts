import { Injectable, Logger } from '@nestjs/common';

import {
  Room,
  RoomStatus,
  RoomUser,
  User,
} from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { CurrentService } from '../../../productinfra/current/current.service';

import { MINIMUM_VALID_INTERVIEW_DURATION } from './rooms.constants';
import { CreateRecordData, CreateRoomUserData } from './rooms.interfaces';

@Injectable()
export class RoomsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly currentService: CurrentService,
  ) {}

  async createRoomUser(entity: CreateRoomUserData): Promise<RoomUser> {
    const currentRoomUser = await this.findCurrentRoomUserAndRoomForUser(
      entity.userId,
    );
    if (currentRoomUser?.roomId === entity.roomId) {
      this.logger.log('User is already in this room', RoomsService.name);
      return currentRoomUser;
    }
    if (currentRoomUser != null) {
      this.logger.error(
        'Failed to join room as user is already in an open room',
        undefined,
        RoomsService.name,
      );
      throw new Error('User is already in an open room');
    }

    return this.prismaService.roomUser.create({ data: { ...entity } });
  }

  /**
   * Finds the active room user for the user, and also returns the room.
   */
  async findCurrentRoomUserAndRoomForUser(
    userId: string,
  ): Promise<(RoomUser & { room: Room }) | null> {
    return this.prismaService.roomUser.findFirst({
      where: { userId, room: { status: RoomStatus.OPEN } },
      include: { room: true },
    });
  }

  /**
   * Takes the latest room with the slug. Room may be closed.
   * Will also fetch the room users.
   */
  findRoomAndRoomUsersBySlug(
    slug: string,
  ): Promise<(Room & { roomUsers: (RoomUser & { user: User })[] }) | null> {
    return this.prismaService.room.findFirst({
      where: { slug }, // Technically, it should be unique, but it's not enforced at DB-level.
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: { roomUsers: { include: { user: true } } },
    });
  }

  findRoomById(roomId: number): Promise<Room | null> {
    return this.prismaService.room.findUnique({ where: { id: roomId } });
  }

  async closeRoom(entity: CreateRecordData, isAuto: boolean): Promise<void> {
    const { roomRecordUsers, ...recordData } = entity;
    const [roomRecord] = await this.prismaService.$transaction([
      this.prismaService.roomRecord.create({
        data: {
          ...recordData,
          isValid:
            recordData.duration >= MINIMUM_VALID_INTERVIEW_DURATION &&
            roomRecordUsers.length === 2,
          roomRecordUsers: { createMany: { data: roomRecordUsers } },
        },
        include: { roomRecordUsers: true },
      }),
      this.prismaService.room.update({
        where: { id: entity.roomId },
        data: {
          status: isAuto
            ? RoomStatus.CLOSED_AUTOMATICALLY
            : RoomStatus.CLOSED_MANUALLY,
          closedAt: new Date(),
        },
      }),
    ]);
    if (roomRecord.isValid) {
      await Promise.all(
        roomRecord.roomRecordUsers.map((roomRecordUser) =>
          this.currentService.maybeAddRoomRecordUserToResult(roomRecordUser),
        ),
      );
    }
  }
}
