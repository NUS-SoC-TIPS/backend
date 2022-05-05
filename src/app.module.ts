import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AgoraModule } from './agora/agora.module';
import { AuthModule } from './auth/auth.module';
import { CodeModule } from './code/code.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    AgoraModule,
    CodeModule,
    NotesModule,
  ],
})
export class AppModule {}
