import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CodeModule } from './code/code.module';
import { NotesModule } from './notes/notes.module';
import { QuestionsModule } from './questions/questions.module';
import { RecordsModule } from './records/records.module';
import { RoomsModule } from './rooms/rooms.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    CodeModule,
    NotesModule,
    QuestionsModule,
    RecordsModule,
    RoomsModule,
    SubmissionsModule,
    UsersModule,
  ],
})
export class GeneralModule {}
