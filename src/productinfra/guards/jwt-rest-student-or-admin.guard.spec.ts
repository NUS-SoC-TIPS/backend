import { Controller, UseGuards } from '@nestjs/common';

import { isGuarded } from '../../utils';

import { JwtRestStudentOrAdminGuard } from './jwt-rest-student-or-admin.guard';

@Controller()
class TestController1 {
  @UseGuards(JwtRestStudentOrAdminGuard)
  testMethod(): void {
    return;
  }
}

@Controller()
@UseGuards(JwtRestStudentOrAdminGuard)
class TestController2 {
  testMethod(): void {
    return;
  }
}

describe('JwtRestStudentOrAdminGuard', () => {
  it('should apply to methods', async () => {
    expect(
      isGuarded(
        TestController1.prototype.testMethod,
        JwtRestStudentOrAdminGuard,
      ),
    ).toBe(true);
  });

  it('should apply to classes', async () => {
    expect(isGuarded(TestController2, JwtRestStudentOrAdminGuard)).toBe(true);
  });
});
