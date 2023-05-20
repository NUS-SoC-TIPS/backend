import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { DataModule } from '../../infra/data/data.module';
import { User, UserRole } from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';

import { JwtRestStrategy } from './jwt-rest.strategy';

describe('JwtRestStrategy', () => {
  let strategy: JwtRestStrategy;
  let prisma: PrismaService;
  const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
    id: '1',
    githubUsername: 'hello',
    name: 'world',
    photoUrl: 'https://avatars.githubusercontent.com/u/45617494?v=4',
    profileUrl: 'https://github.com/zhuhanming',
    role: UserRole.NORMAL,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRestStrategy, ConfigService, PrismaService, Logger],
      imports: [DataModule],
    }).compile();
    strategy = module.get<JwtRestStrategy>(JwtRestStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('initialisation', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validation', () => {
    let user: User;

    beforeAll(async () => {
      await prisma.cleanDb();
      user = await prisma.user.create({
        data: {
          ...userData,
        },
      });
    });

    it('should return the user if they exist', async () => {
      const result = await strategy.validate({ sub: '1' });
      expect(result).toMatchObject(user);
    });

    it('should return null if user does not exist', async () => {
      const result = await strategy.validate({ sub: '2' });
      expect(result).toBeNull();
    });
  });
});
