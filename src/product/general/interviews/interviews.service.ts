import { Injectable, Logger } from '@nestjs/common';
import { generateSlug } from 'random-word-slugs';

import { Room, RoomStatus, RoomUser } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly logger: Logger,
    private readonly prismaService: PrismaService,
  ) {}

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
