import { CanActivate } from '@nestjs/common';

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
