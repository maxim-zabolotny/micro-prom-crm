import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { CrmCategoriesController } from './categories/categories.controller';
import { CrmCategoriesService } from './categories/categories.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '@schemas/category';
import { DataGenerateHelper } from '@common/helpers';
import { Product, ProductSchema } from '@schemas/product';
import { CrmProductsService } from './products/products.service';
import { CrmProductsController } from './products/products.controller';
import { Integration, IntegrationSchema } from '@schemas/integration';
import { CrmIntegrationsController } from './integrations/integrations.controller';
import { CrmIntegrationsService } from './integrations/integrations.service';
import { User, UserSchema } from '@schemas/user';
import { CrmUsersController } from './users/users.controller';
import { CrmUsersService } from './users/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
    MongooseModule.forFeature([
      {
        name: Integration.name,
        schema: IntegrationSchema,
      },
    ]),
  ],
  controllers: [
    CrmController,
    CrmCategoriesController,
    CrmProductsController,
    CrmIntegrationsController,
    CrmUsersController,
  ],
  providers: [
    DataGenerateHelper,
    CrmService,
    CrmCategoriesService,
    CrmProductsService,
    CrmIntegrationsService,
    CrmUsersService,
  ],
  exports: [
    CrmService,
    CrmCategoriesService,
    CrmProductsService,
    CrmIntegrationsService,
    CrmUsersService,
  ],
})
export class CrmModule {}
