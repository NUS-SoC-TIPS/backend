import { ForbiddenException, Injectable } from '@nestjs/common';
import { Room, RoomStatus, RoomUser, User } from '@prisma/client';
import { generateSlug } from 'random-word-slugs';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRoomUserDto } from './dtos/create-room-user.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: string): Promise<Room> {
    const currentRoomUser = await this.findCurrentRoomUser(userId);
    if (currentRoomUser) {
      throw new ForbiddenException('User is already in an open room');
    }

    return await this.prismaService.room.create({
      data: {
        slug: await this.generateRoomSlug(),
        roomUsers: {
          create: {
            userId,
          },
        },
      },
    });
  }

  async createRoomUser(dto: CreateRoomUserDto): Promise<RoomUser> {
    const currentRoomUser = await this.findCurrentRoomUser(dto.userId);
    if (currentRoomUser?.roomId === dto.roomId) {
      return currentRoomUser;
    }
    if (currentRoomUser) {
      throw new ForbiddenException('User is already in an open room');
    }

    return this.prismaService.roomUser.create({
      data: {
        ...dto,
      },
    });
  }

  async findCurrent(userId: string): Promise<Room | null> {
    return (await this.findCurrentRoomUser(userId))?.room;
  }

  /**
   * Takes the latest room with the slug. Room may be closed.
   * Will also fetch the room users.
   */
  findBySlug(
    slug: string,
  ): Promise<(Room & { roomUsers: (RoomUser & { user: User })[] }) | null> {
    return this.prismaService.room.findFirst({
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
    });
  }

  closeRoom(roomId: number, isAuto: boolean): Promise<Room> {
    return this.prismaService.room.update({
      where: {
        id: roomId,
      },
      data: {
        status: isAuto
          ? RoomStatus.CLOSED_AUTOMATICALLY
          : RoomStatus.CLOSED_MANUALLY,
        closedAt: new Date(),
      },
    });
  }

  /**
   * Finds the active room user for the user, and also returns the room.
   */
  private findCurrentRoomUser(
    userId: string,
  ): Promise<(RoomUser & { room: Room }) | null> {
    return this.prismaService.roomUser.findFirst({
      where: {
        userId,
        room: {
          status: RoomStatus.OPEN,
        },
      },
      include: {
        room: true,
      },
    });
  }

  private async generateRoomSlug(): Promise<string> {
    let slug: string;
    let existingRoom: Room | null;

    do {
      slug = generateSlug();
      existingRoom = await this.prismaService.room.findFirst({
        where: {
          slug,
          status: RoomStatus.OPEN,
        },
      });
    } while (existingRoom != null);

    return slug;
  }
}
