import { Injectable } from '@nestjs/common';
import { RoomRecord } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRecordDto } from './dtos';

@Injectable()
export class RecordsService {
  constructor(private prismaService: PrismaService) {}

  create(dto: CreateRecordDto): Promise<RoomRecord> {
    const { users, ...recordData } = dto;
    return this.prismaService.roomRecord.create({
      data: {
        ...recordData,
        users: {
          createMany: {
            data: users,
          },
        },
      },
    });
  }
}
