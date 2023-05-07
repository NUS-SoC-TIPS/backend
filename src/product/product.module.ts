import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { GeneralModule } from './general/general.module';
import { StudentModule } from './student/student.module';

@Module({
  imports: [AdminModule, GeneralModule, StudentModule],
})
export class ProductModule {}
