import { Module } from '@nestjs/common';

import { DevModule } from './dev/dev.module';
import { InfraModule } from './infra/infra.module';
import { ProductModule } from './product/product.module';
import { ProductInfraModule } from './productinfra/productinfra.module';
import { WindowsModule } from './windows/windows.module';

@Module({
  imports: [
    InfraModule,
    ProductInfraModule,
    ProductModule,
    WindowsModule,
    ...(process.env.NODE_ENV === 'development' ? [DevModule] : []),
  ],
})
export class AppModule {}
