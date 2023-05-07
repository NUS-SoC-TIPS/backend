import { Logger } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../infra/prisma/prisma.service';
import { FirebaseService } from '../../../productinfra/firebase/firebase.service';
import { mocker } from '../../../utils';
import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';
import { AuthDto } from './dtos';

describe('AuthService', () => {
  let service: AuthService;
  const authDto: AuthDto = {
    token: '123',
    githubUsername: 'hello',
    name: 'world',
    photoUrl: 'https://avatars.githubusercontent.com/u/45617494?v=4',
    profileUrl: 'https://github.com/zhuhanming',
  };

  describe('initialisation', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [AuthService, PrismaService, UsersService, Logger],
      })
        .useMocker(mocker)
        .compile();
      service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('integration with Firebase', () => {
    let verifyToken: jest.Mock;

    beforeEach(async () => {
      verifyToken = jest.fn().mockResolvedValue('1');
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: 'secret',
            signOptions: {
              expiresIn: '7d',
            },
          }),
        ],
        providers: [AuthService, PrismaService, UsersService, Logger],
      })
        .useMocker((token) => {
          if (token === FirebaseService) {
            return { verifyToken };
          }
          return mocker(token);
        })
        .compile();
      service = module.get<AuthService>(AuthService);
    });

    it('should verify token with firebase', async () => {
      await service.login(authDto);
      expect(verifyToken.mock.calls).toHaveLength(1);
      // Expect it to have been called with the token
      expect(verifyToken.mock.calls[0][0]).toBe(authDto.token);
    });
  });

  describe('integration with UsersService', () => {
    let prisma: PrismaService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: 'secret',
            signOptions: {
              expiresIn: '7d',
            },
          }),
        ],
        providers: [AuthService, PrismaService, UsersService, Logger],
      })
        .useMocker((token) => {
          if (token === FirebaseService) {
            return { verifyToken: jest.fn().mockResolvedValue('1') };
          }
          return mocker(token);
        })
        .compile();
      service = module.get<AuthService>(AuthService);
      prisma = module.get<PrismaService>(PrismaService);
      await prisma.cleanDb();
    });

    it('should create user via users service', async () => {
      await service.login(authDto);
      const user = await prisma.user.findUnique({
        where: {
          id: '1',
        },
      });
      const { token: _token, ...userInfo } = authDto;
      expect(user).toMatchObject(userInfo);
    });
  });

  describe('integration with JWT', () => {
    let jwt: JwtService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          JwtModule.register({
            secret: 'secret',
            signOptions: {
              expiresIn: '7d',
            },
          }),
        ],
        providers: [AuthService, PrismaService, UsersService, Logger],
      })
        .useMocker((token) => {
          if (token === FirebaseService) {
            return { verifyToken: jest.fn().mockResolvedValue('1') };
          }
          return mocker(token);
        })
        .compile();
      service = module.get<AuthService>(AuthService);
      jwt = module.get<JwtService>(JwtService);
    });

    it('should return a token', async () => {
      const token = await service.login(authDto);
      const result = await jwt.verifyAsync(token, {
        secret: 'secret',
      });
      expect(result).toMatchObject({ sub: '1' });
    });
  });
});
