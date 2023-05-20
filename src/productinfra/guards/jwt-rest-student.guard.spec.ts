import { Controller, UseGuards } from '@nestjs/common';

import { isGuarded } from '../../utils';

import { JwtRestStudentGuard } from './jwt-rest-student.guard';

@Controller()
class TestController1 {
  @UseGuards(JwtRestStudentGuard)
  testMethod(): void {
    return;
  }
}

@Controller()
@UseGuards(JwtRestStudentGuard)
class TestController2 {
  testMethod(): void {
    return;
  }
}

describe('JwtRestStudentGuard', () => {
  it('should apply to methods', async () => {
    expect(
      isGuarded(TestController1.prototype.testMethod, JwtRestStudentGuard),
    ).toBe(true);
  });

  it('should apply to classes', async () => {
    expect(isGuarded(TestController2, JwtRestStudentGuard)).toBe(true);
  });
});
