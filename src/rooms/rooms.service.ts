import { Injectable, Logger } from '@nestjs/common';
import { Room, RoomStatus, RoomUser, User } from '@prisma/client';
import { generateSlug } from 'random-word-slugs';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRecordDto, CreateRoomUserDto } from './dtos';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: Logger,
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

    return await this.prismaService.room
      .create({
        data: {
          slug: await this.generateRoomSlug(),
          roomUsers: {
            create: {
              userId,
            },
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          'Failed to find create new room',
          e instanceof Error ? e.stack : undefined,
          RoomsService.name,
        );
        throw e;
      });
  }

  async createRoomUser(dto: CreateRoomUserDto): Promise<RoomUser> {
    const currentRoomUser = await this.findCurrentRoomUser(dto.userId);
    if (currentRoomUser?.roomId === dto.roomId) {
      this.logger.log('User is already in this room', RoomsService.name);
      return currentRoomUser;
    }
    if (currentRoomUser) {
      this.logger.error(
        'Failed to join room as user is already in an open room',
        undefined,
        RoomsService.name,
      );
      throw new Error('User is already in an open room');
    }

    return this.prismaService.roomUser
      .create({
        data: {
          ...dto,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to create room user for user with ID: ${dto.userId} and room with ID: ${dto.roomId}`,
          e instanceof Error ? e.stack : undefined,
          RoomsService.name,
        );
        throw e;
      });
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
    return this.prismaService.room
      .findFirst({
        where: {
          slug,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          roomUsers: {
            include: {
              user: true,
            },
          },
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find nullable room by slug for room with slug: ${slug}`,
          e instanceof Error ? e.stack : undefined,
          RoomsService.name,
        );
        throw e;
      });
  }

  findById(roomId: number): Promise<Room | null> {
    return this.prismaService.room
      .findFirst({
        where: { id: roomId },
        take: 1,
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find nullable room by ID for room with ID: ${roomId}`,
          e instanceof Error ? e.stack : undefined,
          RoomsService.name,
        );
        throw e;
      });
  }

  async closeRoom(dto: CreateRecordDto, isAuto: boolean): Promise<void> {
    const { roomRecordUsers, ...recordData } = dto;
    await this.prismaService
      .$transaction([
        this.prismaService.roomRecord.create({
          data: {
            ...recordData,
            roomRecordUsers: {
              createMany: {
                data: roomRecordUsers,
              },
            },
          },
        }),
        this.prismaService.room.update({
          where: {
            id: dto.roomId,
          },
          data: {
            status: isAuto
              ? RoomStatus.CLOSED_AUTOMATICALLY
              : RoomStatus.CLOSED_MANUALLY,
            closedAt: new Date(),
          },
        }),
      ])
      .catch((e) => {
        this.logger.error(
          'Failed to close room',
          e instanceof Error ? e.stack : undefined,
          RoomsService.name,
        );
        throw e;
      });
  }

  /**
   * Finds the active room user for the user, and also returns the room.
   */
  private findCurrentRoomUser(
    userId: string,
  ): Promise<(RoomUser & { room: Room }) | null> {
    return this.prismaService.roomUser
      .findFirst({
        where: {
          userId,
          room: {
            status: RoomStatus.OPEN,
          },
        },
        include: {
          room: true,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find nullable current room user with user ID: ${userId}`,
          e instanceof Error ? e.stack : undefined,
          RoomsService.name,
        );
        throw e;
      });
  }

  private async generateRoomSlug(): Promise<string> {
    let slug: string;
    let existingRoom: Room | null;

    do {
      slug = generateSlug();
      existingRoom = await this.prismaService.room
        .findFirst({
          where: {
            slug,
            status: RoomStatus.OPEN,
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to find existing room with slug',
            e instanceof Error ? e.stack : undefined,
            RoomsService.name,
          );
          throw e;
        });
    } while (existingRoom != null);

    return slug;
  }
}
