import { Module } from '@nestjs/common';

import { CurrentModule } from './current/current.module';
import { FirebaseModule } from './firebase/firebase.module';
import { Judge0Module } from './judge0/judge0.module';
import { WebrtcModule } from './webrtc/webrtc.module';
import {
  JwtRestAdminStrategy,
  JwtRestStrategy,
  JwtRestStudentOrAdminStrategy,
} from './strategies';

@Module({
  imports: [WebrtcModule, Judge0Module, CurrentModule, FirebaseModule],
  providers: [
    JwtRestStrategy,
    JwtRestAdminStrategy,
    JwtRestStudentOrAdminStrategy,
  ],
})
export class ProductInfraModule {}
