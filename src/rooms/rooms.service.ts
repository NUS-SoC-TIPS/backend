import { ForbiddenException, Injectable } from '@nestjs/common';
import { Room, RoomStatus } from '@prisma/client';
import { generateSlug } from 'random-word-slugs';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prismaService: PrismaService) {}

  async create(userId: string): Promise<Room> {
    const currentRoom = await this.findCurrentRoomUser(userId);
    if (currentRoom) {
      throw new ForbiddenException('User is already in an open room');
    }

    return await this.prismaService.room.create({
      data: {
        slug: await this.getRoomSlug(),
        roomUsers: {
          create: {
            userId,
          },
        },
      },
    });
  }

  findCurrent(userId: string): Promise<Room | null> {
    return this.findCurrentRoomUser(userId);
  }

  /**
   * Finds the open room that the user is currently in.
   */
  private async findCurrentRoomUser(userId: string): Promise<Room | null> {
    const roomUser = await this.prismaService.roomUser.findFirst({
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
    return roomUser?.room;
  }

  private async getRoomSlug(): Promise<string> {
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
