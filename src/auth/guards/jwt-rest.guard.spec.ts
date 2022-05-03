import { Controller, UseGuards } from '@nestjs/common';

import { isGuarded } from '../../utils/is-guarded.util';

import { JwtRestGuard } from './jwt-rest.guard';

@Controller()
class TestController1 {
  @UseGuards(JwtRestGuard)
  testMethod(): void {
    return;
  }
}

@Controller()
@UseGuards(JwtRestGuard)
class TestController2 {
  testMethod(): void {
    return;
  }
}

describe('JwtRestGuard', () => {
  it('should apply to methods', async () => {
    expect(isGuarded(TestController1.prototype.testMethod, JwtRestGuard)).toBe(
      true,
    );
  });

  it('should apply to classes', async () => {
    expect(isGuarded(TestController2, JwtRestGuard)).toBe(true);
  });
});
