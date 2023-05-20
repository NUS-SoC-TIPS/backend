import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRestStudentGuard extends AuthGuard('jwt-rest-student') {}
