import { INestApplication, InjectionToken } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Mock, MockFunctionMetadata, ModuleMocker } from 'jest-mock';

import { User } from '../infra/prisma/generated';
import { PrismaService } from '../infra/prisma/prisma.service';

const moduleMocker = new ModuleMocker(global);

export const mocker = (token: InjectionToken | undefined): Mock | undefined => {
  if (typeof token === 'function') {
    const mockMetadata = moduleMocker.getMetadata(
      token,
    ) as MockFunctionMetadata<any, any>;
    const Mock = moduleMocker.generateFromMetadata(mockMetadata);
    return new Mock();
  }
};

/**
 * Checks whether a route or a controller is protected with the specified guard.
 *
 * @param route is the route or controller to be tested for the guard.
 * @param guardType is the type of the guard, for example, JwtRestGuard.
 * @returns true if the specified guard is applied.
 */
export const isGuarded = (
  route: ((...args: any[]) => any) | (new (...args: any[]) => unknown),
  guardType: new (...args: any[]) => CanActivate,
): boolean => {
  const guards = Reflect.getMetadata('__guards__', route);
  if (!guards) {
    throw Error(
      `Expected: ${route.name} to be protected with ${guardType.name}\nReceived: No guard`,
    );
  }
  const guard = new guards[0]();
  return guard instanceof guardType;
};

/**
 * Creates a user with the given userId and returns the relevant JWT.
 */
export const createUserAndLogin = async (
  app: INestApplication,
  userId = '1',
): Promise<{ user: User; token: string }> => {
  const prismaService = app.get(PrismaService);
  const user = await prismaService.user.create({
    data: {
      id: userId,
      githubUsername: `hello-${userId}`,
      name: `world-${userId}`,
      photoUrl: 'https://avatars.githubusercontent.com/u/45617494?v=4',
      profileUrl: 'https://github.com/zhuhanming',
    },
  });

  const jwtService = app.get(JwtService);
  return { user, token: await jwtService.signAsync({ sub: userId }) };
};
