import { Controller, UseGuards } from '@nestjs/common';

import { isGuarded } from '../../utils';

import { JwtRestAdminGuard } from './jwt-rest-admin.guard';

@Controller()
class TestController1 {
  @UseGuards(JwtRestAdminGuard)
  testMethod(): void {
    return;
  }
}

@Controller()
@UseGuards(JwtRestAdminGuard)
class TestController2 {
  testMethod(): void {
    return;
  }
}

describe('JwtRestAdminGuard', () => {
  it('should apply to methods', async () => {
    expect(
      isGuarded(TestController1.prototype.testMethod, JwtRestAdminGuard),
    ).toBe(true);
  });

  it('should apply to classes', async () => {
    expect(isGuarded(TestController2, JwtRestAdminGuard)).toBe(true);
  });
});
