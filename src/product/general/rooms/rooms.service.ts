import { Injectable, Logger } from '@nestjs/common';
import { generateSlug } from 'random-word-slugs';

import {
  Room,
  RoomStatus,
  RoomUser,
  User,
} from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { ResultsService } from '../../../productinfra/results/results.service';

import { CreateRecordDto, CreateRoomUserDto } from './dtos';
import { MINIMUM_VALID_INTERVIEW_DURATION } from './rooms.constants';

@Injectable()
export class RoomsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private readonly resultsService: ResultsService,
  ) {}

  async create(userId: string): Promise<Room> {
    const currentRoomUser = await this.findCurrentRoomUser(userId);
    if (currentRoomUser) {
      this.logger.error(
        'Failed to create room as user is already in an open room',
        undefined,
        RoomsService.name,
      );
      throw new Error('User is already in an open room');
    }

    return await this.prismaService.room.create({
      data: {
        slug: await this.generateRoomSlug(),
        roomUsers: { create: { userId } },
      },
    });
  }

  async createRoomUser(dto: CreateRoomUserDto): Promise<RoomUser> {
    const currentRoomUser = await this.findCurrentRoomUser(dto.userId);
    if (currentRoomUser?.roomId === dto.roomId) {
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

    return this.prismaService.roomUser.create({ data: { ...dto } });
  }

  async findCurrent(userId: string): Promise<Room | null> {
    return (await this.findCurrentRoomUser(userId))?.room ?? null;
  }

  /**
   * Takes the latest room with the slug. Room may be closed.
   * Will also fetch the room users.
   */
  findBySlug(
    slug: string,
  ): Promise<(Room & { roomUsers: (RoomUser & { user: User })[] }) | null> {
    return this.prismaService.room.findFirst({
      where: { slug },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: { roomUsers: { include: { user: true } } },
    });
  }

  findById(roomId: number): Promise<Room | null> {
    return this.prismaService.room.findFirst({
      where: { id: roomId },
      take: 1,
    });
  }

  async closeRoom(dto: CreateRecordDto, isAuto: boolean): Promise<void> {
    const { roomRecordUsers, ...recordData } = dto;
    const [roomRecord, _] = await this.prismaService.$transaction([
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
        where: { id: dto.roomId },
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
          this.resultsService.maybeMatchRoomRecordUser(roomRecordUser),
        ),
      );
    }
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
