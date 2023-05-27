import { Injectable } from '@nestjs/common';

import { Settings, User } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';

import { UpdateSettingsDto } from './dtos';
import { makeUserSelf, UserSelf } from './users.interfaces';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findSelf(user: User): Promise<UserSelf> {
    const { id } = user;
    const settings = await this.findSettings(id);
    const isStudent = await this.findIsStudent(id);
    return makeUserSelf({ ...user, settings }, isStudent);
  }

  async updateSettings(user: User, dto: UpdateSettingsDto): Promise<void> {
    const { photoUrl, preferredInterviewLanguage, preferredKeyBinding } = dto;
    const name = dto.name.trim();
    // Finding settings may throw. We will not catch here and instead let the controller handle it.
    const settings = await this.findSettings(user.id);
    const hasUpdatedName = settings?.hasUpdatedName ?? name !== user.name;
    const hasUpdatedPhoto =
      settings?.hasUpdatedPhoto ?? photoUrl !== user.photoUrl;

    // Wrap in a transaction so that if any of the updates fail, the whole change is rolled back
    await this.prismaService.$transaction(async (tx) => {
      await tx.settings.upsert({
        create: {
          userId: user.id,
          hasUpdatedName,
          hasUpdatedPhoto,
          preferredInterviewLanguage,
          preferredKeyBinding,
        },
        update: {
          hasUpdatedName,
          hasUpdatedPhoto,
          preferredInterviewLanguage,
          preferredKeyBinding,
        },
        where: { userId: user.id },
      });

      if (name !== user.name || photoUrl !== user.photoUrl) {
        await tx.user.update({
          data: { name: name, photoUrl: photoUrl },
          where: { id: user.id },
        });
      }
    });
  }

  private findSettings(userId: string): Promise<Settings | null> {
    return this.prismaService.settings.findUnique({ where: { userId } });
  }

  private async findIsStudent(userId: string): Promise<boolean> {
    return (await this.prismaService.student.count({ where: { userId } })) > 0;
  }
}
