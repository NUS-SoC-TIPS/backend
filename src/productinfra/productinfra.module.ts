import { Module } from '@nestjs/common';

import { AgoraModule } from './agora/agora.module';
import { FirebaseModule } from './firebase/firebase.module';
import { Judge0Module } from './judge0/judge0.module';
import { ResultsModule } from './results/results.module';
import { WindowsModule } from './windows/windows.module';
import {
  JwtRestAdminStrategy,
  JwtRestStrategy,
  JwtRestStudentStrategy,
} from './strategies';

@Module({
  imports: [
    AgoraModule,
    FirebaseModule,
    Judge0Module,
    ResultsModule,
    WindowsModule,
  ],
  providers: [JwtRestStrategy, JwtRestAdminStrategy, JwtRestStudentStrategy],
})
export class ProductInfraModule {}
