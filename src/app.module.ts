import { Module } from '@nestjs/common';

import { DevModule } from './dev/dev.module';
import { InfraModule } from './infra/infra.module';
import { ProductModule } from './product/product.module';
import { ProductInfraModule } from './productinfra/productinfra.module';

@Module({
  imports: [
    InfraModule,
    ProductInfraModule,
    ProductModule,
    ...(process.env.NODE_ENV === 'development' ? [DevModule] : []),
  ],
})
export class AppModule {}
