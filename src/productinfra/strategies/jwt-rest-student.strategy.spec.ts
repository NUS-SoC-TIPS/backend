import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { DataModule } from '../../infra/data/data.module';
import { User, UserRole } from '../../infra/prisma/generated';
import { PrismaService } from '../../infra/prisma/prisma.service';

import { JwtRestStudentStrategy } from './jwt-rest-student.strategy';

describe('JwtRestStudentStrategy', () => {
  let strategy: JwtRestStudentStrategy;
  let prisma: PrismaService;
  const studentUserData: Omit<User, 'createdAt' | 'updatedAt'> = {
    id: '1',
    githubUsername: 'hello',
    name: 'world',
    photoUrl: 'https://avatars.githubusercontent.com/u/45617494?v=4',
    profileUrl: 'https://github.com/zhuhanming',
    role: UserRole.NORMAL,
  };
  const nonStudentUserData: Omit<User, 'createdAt' | 'updatedAt'> = {
    ...studentUserData,
    id: '2',
    githubUsername: 'world',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtRestStudentStrategy, ConfigService, PrismaService, Logger],
      imports: [DataModule],
    }).compile();
    strategy = module.get<JwtRestStudentStrategy>(JwtRestStudentStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('initialisation', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });
  });

  describe('validation', () => {
    let studentUser: User;

    beforeAll(async () => {
      await prisma.cleanDb();
      studentUser = await prisma.user.create({
        data: {
          ...studentUserData,
        },
      });
      const cohort = await prisma.cohort.create({
        data: { name: 'Test cohort' },
      });
      await prisma.student.create({
        data: {
          userId: studentUser.id,
          cohortId: cohort.id,
          coursemologyName: '',
          coursemologyProfileUrl: '',
        },
      });
      await prisma.user.create({
        data: {
          ...nonStudentUserData,
        },
      });
    });

    it('should return the user if they exist and is student', async () => {
      const result = await strategy.validate({ sub: '1' });
      expect(result).toMatchObject(studentUser);
    });

    it('should return null if they exist but is not student', async () => {
      const result = await strategy.validate({ sub: '2' });
      expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      const result = await strategy.validate({ sub: '3' });
      expect(result).toBeNull();
    });
  });
});
