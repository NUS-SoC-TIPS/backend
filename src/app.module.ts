import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AgoraModule } from './agora/agora.module';
import { AuthModule } from './auth/auth.module';
import { CodeModule } from './code/code.module';
import { DataModule } from './data/data.module';
import { DevModule } from './dev/dev.module';
import { FirebaseModule } from './firebase/firebase.module';
import { Judge0Module } from './judge0/judge0.module';
import { NotesModule } from './notes/notes.module';
import { PrismaModule } from './prisma/prisma.module';
import { QuestionsModule } from './questions/questions.module';
import { RecordsModule } from './records/records.module';
import { RoomsModule } from './rooms/rooms.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { WindowsModule } from './windows/windows.module';

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
    Judge0Module,
    CodeModule,
    RecordsModule,
    NotesModule,
    SubmissionsModule,
    QuestionsModule,
    WindowsModule,
    AdminModule,
    TasksModule,
    ...(process.env.NODE_ENV === 'development' ? [DevModule] : []),
  ],
})
export class AppModule {}
