import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRestGuard extends AuthGuard('jwt-rest') {}
