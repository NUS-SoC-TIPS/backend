import { Injectable } from '@nestjs/common';
import { Settings, User } from '@prisma/client';

import { DataService } from '../data/data.service';
import { PrismaService } from '../prisma/prisma.service';

import { UpdateSettingsDto, UpsertUserDto } from './dtos';
import { AppConfig, UserSettingsConfig } from './entities';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly dataService: DataService,
  ) {}

  find(userId: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { id: userId } });
  }

  findSettings(userId: string): Promise<Settings | null> {
    return this.prismaService.settings.findUnique({
      where: {
        userId,
      },
    });
  }

  findAppConfig(): AppConfig {
    return this.dataService.getConfigData();
  }

  async updateSettings(
    user: User,
    dto: UpdateSettingsDto,
  ): Promise<UserSettingsConfig> {
    const { name, photoUrl, preferredInterviewLanguage } = dto;
    const settings = await this.findSettings(user.id);
    const hasUpdatedName =
      settings?.hasUpdatedName || (name && name !== user.name);
    const hasUpdatedPhoto =
      settings?.hasUpdatedPhoto || (photoUrl && photoUrl !== user.photoUrl);

    const updatedSettings = await this.prismaService.settings.upsert({
      create: {
        userId: user.id,
        hasUpdatedName,
        hasUpdatedPhoto,
        preferredInterviewLanguage,
      },
      update: {
        hasUpdatedName,
        hasUpdatedPhoto,
        preferredInterviewLanguage,
      },
      where: {
        userId: user.id,
      },
    });

    let updatedUser = user;
    if (name !== user.name || photoUrl !== user.photoUrl) {
      updatedUser = await this.prismaService.user.update({
        data: {
          name: name?.trim() ?? user.name,
          photoUrl: photoUrl ?? user.photoUrl,
        },
        where: {
          id: user.id,
        },
      });
    }

    return {
      ...updatedUser,
      settings: updatedSettings,
      config: this.findAppConfig(),
    };
  }

  async upsertUser(dto: UpsertUserDto): Promise<User> {
    const settings = await this.findSettings(dto.id);
    return this.prismaService.user.upsert({
      where: {
        id: dto.id,
      },
      update: {
        ...dto,
        name: settings?.hasUpdatedName ? undefined : dto.name,
        photoUrl: settings?.hasUpdatedPhoto ? undefined : dto.photoUrl,
      },
      create: {
        ...dto,
      },
    });
  }
}
