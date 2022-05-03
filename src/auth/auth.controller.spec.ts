import { Test, TestingModule } from '@nestjs/testing';

import { mocker } from '../utils/mocker';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDto } from './dtos';

describe('AuthController', () => {
  let controller: AuthController;
  const authDto: AuthDto = {
    token: '123',
    githubUsername: 'hello',
    photoUrl: 'https://avatars.githubusercontent.com/u/45617494?v=4',
    profileUrl: 'https://github.com/zhuhanming',
  };

  describe('initialisation', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
      })
        .useMocker(mocker)
        .compile();
      controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('integration with AuthService', () => {
    let login: jest.Mock;

    beforeEach(async () => {
      login = jest.fn().mockResolvedValue('1');
      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
      })
        .useMocker((token) => {
          if (token === AuthService) {
            return { login };
          }
          return mocker(token);
        })
        .compile();
      controller = module.get<AuthController>(AuthController);
    });

    it('should call auth service', async () => {
      const result = await controller.login(authDto);
      expect(login.mock.calls).toHaveLength(1);
      // Expect it to have been called with the auth dto
      expect(login.mock.calls[0][0]).toMatchObject(authDto);
      expect(result).toHaveProperty('token');
    });
  });
});
