import { InjectionToken } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { Mock, MockFunctionMetadata, ModuleMocker } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

export const mocker = (token: InjectionToken): Mock | undefined => {
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
export function isGuarded(
  route: ((...args: any[]) => any) | (new (...args: any[]) => unknown),
  guardType: new (...args: any[]) => CanActivate,
): boolean {
  const guards = Reflect.getMetadata('__guards__', route);
  if (!guards) {
    throw Error(
      `Expected: ${route.name} to be protected with ${guardType.name}\nReceived: No guard`,
    );
  }
  const guard = new guards[0]();
  return guard instanceof guardType;
}
