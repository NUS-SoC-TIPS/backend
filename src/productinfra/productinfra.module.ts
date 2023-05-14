import { Module } from '@nestjs/common';

import { AgoraModule } from './agora/agora.module';
import { FirebaseModule } from './firebase/firebase.module';
import { Judge0Module } from './judge0/judge0.module';
import { ResultsModule } from './results/results.module';
import { WindowsModule } from './windows/windows.module';

@Module({
  imports: [
    AgoraModule,
    FirebaseModule,
    Judge0Module,
    ResultsModule,
    WindowsModule,
  ],
})
export class ProductInfraModule {}
