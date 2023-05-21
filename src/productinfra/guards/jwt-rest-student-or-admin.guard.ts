import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRestStudentOrAdminGuard extends AuthGuard(
  'jwt-rest-student-or-admin',
) {}
