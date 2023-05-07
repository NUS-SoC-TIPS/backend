import { Module } from '@nestjs/common';

import { AgoraModule } from './agora/agora.module';
import { FirebaseModule } from './firebase/firebase.module';
import { Judge0Module } from './judge0/judge0.module';

@Module({
  imports: [AgoraModule, FirebaseModule, Judge0Module],
})
export class ProductInfraModule {}
