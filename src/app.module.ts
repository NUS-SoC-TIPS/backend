import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AgoraModule } from './agora/agora.module';
import { AuthModule } from './auth/auth.module';
import { CodeModule } from './code/code.module';
import { DataModule } from './data/data.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { RecordsModule } from './records/records.module';
import { RoomsModule } from './rooms/rooms.module';
import { StatsModule } from './stats/stats.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DataModule,
    FirebaseModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    AgoraModule,
    CodeModule,
    RecordsModule,
    NotesModule,
    SubmissionsModule,
    QuestionsModule,
    StatsModule,
  ],
})
export class AppModule {}
