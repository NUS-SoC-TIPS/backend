import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { DataModule } from '../../data/data.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthDto } from '../dtos';

import { JwtRestAdminStrategy } from './jwt-rest-admin.strategy';

describe('JwtRestAdminStrategy', () => {
  let strategy: JwtRestAdminStrategy;
  let prisma: PrismaService;
  const adminData: Omit<AuthDto, 'token'> & { id: string; role: UserRole } = {
    id: '1',
    githubUsername: 'hello',
    name: 'world',
    photoUrl: 'https://avatars.githubusercontent.com/u/45617494?v=4',
    profileUrl: 'https://github.com/zhuhanming',
    role: UserRole.ADMIN,
  };
  const normalData: Omit<AuthDto, 'token'> & { id: string; role: UserRole } = {
    ...adminData,
    id: '2',
    githubUsername: 'world',
    role: UserRole.NORMAL,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRestAdminStrategy, ConfigService, PrismaService, Logger],
      imports: [DataModule],
    }).compile();
    strategy = module.get<JwtRestAdminStrategy>(JwtRestAdminStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('initialisation', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validation', () => {
    let admin: User;

    beforeAll(async () => {
      await prisma.cleanDb();
      admin = await prisma.user.create({
        data: {
          ...adminData,
        },
      });
      await prisma.user.create({
        data: {
          ...normalData,
        },
      });
    });

    it('should return the user if they exist and is admin', async () => {
      const result = await strategy.validate({ sub: '1' });
      expect(result).toMatchObject(admin);
    });

    it('should return null if they exist but is not admin', async () => {
      const result = await strategy.validate({ sub: '2' });
      expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      const result = await strategy.validate({ sub: '3' });
      expect(result).toBeNull();
    });
  });
});
