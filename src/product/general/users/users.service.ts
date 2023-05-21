import { Injectable } from '@nestjs/common';

import { Settings, User } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';

import { UpdateSettingsDto, UpsertUserDto } from './dtos';
import { UserWithSettings } from './entities';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  findOrThrow(userId: string): Promise<User> {
    return this.prismaService.user.findUniqueOrThrow({ where: { id: userId } });
  }

  findSettings(userId: string): Promise<Settings | null> {
    return this.prismaService.settings.findUnique({ where: { userId } });
  }

  async findIsStudent(userId: string): Promise<boolean> {
    return (await this.prismaService.student.count({ where: { userId } })) > 0;
  }

  async updateSettings(
    user: User,
    dto: UpdateSettingsDto,
  ): Promise<UserWithSettings> {
    const { name, photoUrl, preferredInterviewLanguage, preferredKeyBinding } =
      dto;
    // Finding settings may throw. We will not catch here and instead let the controller handle it.
    const settings = await this.findSettings(user.id);
    const hasUpdatedName = settings?.hasUpdatedName ?? name !== user.name;
    const hasUpdatedPhoto =
      settings?.hasUpdatedPhoto ?? photoUrl !== user.photoUrl;

    return await this.prismaService.$transaction(async (tx) => {
      const updatedSettings = await tx.settings.upsert({
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

      let updatedUser = user;
      if (name !== user.name || photoUrl !== user.photoUrl) {
        updatedUser = await tx.user.update({
          data: { name: name.trim(), photoUrl: photoUrl },
          where: { id: user.id },
        });
      }

      const isStudent =
        (await tx.student.count({ where: { userId: user.id } })) > 0;

      return {
        ...updatedUser,
        settings: updatedSettings,
        isStudent,
      };
    });
  }

  async upsertUser(dto: UpsertUserDto): Promise<User> {
    const settings = await this.findSettings(dto.id);
    return this.prismaService.user.upsert({
      where: { id: dto.id },
      update: {
        ...dto,
        name: settings?.hasUpdatedName ? undefined : dto.name,
        photoUrl: settings?.hasUpdatedPhoto ? undefined : dto.photoUrl,
      },
      create: { ...dto },
    });
  }
}
