import { Injectable, Logger } from '@nestjs/common';

import { DataService } from '../../../infra/data/data.service';
import { Settings, User } from '../../../infra/prisma/generated';
import { PrismaService } from '../../../infra/prisma/prisma.service';

import { UpdateSettingsDto, UpsertUserDto } from './dtos';
import { AppConfig, UserSettingsConfig } from './entities';

@Injectable()
export class UsersService {
  constructor(
    private readonly logger: Logger,
    private readonly dataService: DataService,
    private readonly prismaService: PrismaService,
  ) {}

  findOrThrow(userId: string): Promise<User> {
    return this.prismaService.user
      .findUniqueOrThrow({ where: { id: userId } })
      .catch((e) => {
        this.logger.error(
          `Failed to find non-null user with ID: ${userId}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );
        throw e;
      });
  }

  findSettings(userId: string): Promise<Settings | null> {
    return this.prismaService.settings
      .findUnique({
        where: {
          userId,
        },
      })
      .catch((e) => {
        this.logger.error(
          `Failed to find nullable settings for user with ID: ${userId}`,
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );
        throw e;
      });
  }

  findAppConfig(): AppConfig {
    return this.dataService.getConfigData();
  }

  async updateSettings(
    user: User,
    dto: UpdateSettingsDto,
  ): Promise<UserSettingsConfig> {
    const { name, photoUrl, preferredInterviewLanguage, preferredKeyBinding } =
      dto;
    // Finding settings may throw. We will not catch here and instead let the controller handle it.
    const settings = await this.findSettings(user.id);
    const hasUpdatedName = settings?.hasUpdatedName ?? name !== user.name;
    const hasUpdatedPhoto =
      settings?.hasUpdatedPhoto ?? photoUrl !== user.photoUrl;

    return await this.prismaService.$transaction(async (tx) => {
      const updatedSettings = await tx.settings
        .upsert({
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
          where: {
            userId: user.id,
          },
        })
        .catch((e) => {
          this.logger.error(
            'Failed to upsert user settings',
            e instanceof Error ? e.stack : undefined,
            UsersService.name,
          );
          throw e;
        });

      let updatedUser = user;
      if (name !== user.name || photoUrl !== user.photoUrl) {
        updatedUser = await tx.user
          .update({
            data: {
              name: name.trim(),
              photoUrl: photoUrl,
            },
            where: {
              id: user.id,
            },
          })
          .catch((e) => {
            this.logger.error(
              'Failed to update user with non-default name and photoUrl',
              e instanceof Error ? e.stack : undefined,
              UsersService.name,
            );
            throw e;
          });
      }

      return {
        ...updatedUser,
        settings: updatedSettings,
        config: this.findAppConfig(),
      };
    });
  }

  async upsertUser(dto: UpsertUserDto): Promise<User> {
    const settings = await this.findSettings(dto.id);
    return this.prismaService.user
      .upsert({
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
      })
      .catch((e) => {
        this.logger.error(
          'Failed to upsert user',
          e instanceof Error ? e.stack : undefined,
          UsersService.name,
        );
        throw e;
      });
  }
}