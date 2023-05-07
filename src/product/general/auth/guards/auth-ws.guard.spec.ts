import { Controller, UseGuards } from '@nestjs/common';

import { isGuarded } from '../../../../utils';

import { AuthWsGuard } from './auth-ws.guard';

@Controller()
class TestController1 {
  @UseGuards(AuthWsGuard)
  testMethod(): void {
    return;
  }
}

@Controller()
@UseGuards(AuthWsGuard)
class TestController2 {
  testMethod(): void {
    return;
  }
}

describe('AuthWsGuard', () => {
  it('should apply to methods', async () => {
    expect(isGuarded(TestController1.prototype.testMethod, AuthWsGuard)).toBe(
      true,
    );
  });

  it('should apply to classes', async () => {
    expect(isGuarded(TestController2, AuthWsGuard)).toBe(true);
  });
});
