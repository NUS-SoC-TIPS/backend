import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CodeModule } from './code/code.module';
import { InterviewsModule } from './interviews/interviews.module';
import { NotesModule } from './notes/notes.module';
import { QuestionsModule } from './questions/questions.module';
import { RoomsModule } from './rooms/rooms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    CodeModule,
    NotesModule,
    RoomsModule,
    UsersModule,
    QuestionsModule,
    InterviewsModule,
  ],
})
export class GeneralModule {}
