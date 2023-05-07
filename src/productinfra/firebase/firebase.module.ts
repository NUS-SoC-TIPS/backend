import { Global, Logger, Module } from '@nestjs/common';

import { FirebaseService } from './firebase.service';

@Global()
@Module({
  providers: [FirebaseService, Logger],
  exports: [FirebaseService],
})
export class FirebaseModule {}
