import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Constant, ConstantDocument } from '@schemas/constant';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { DataGenerateHelper, DataUtilsHelper } from '@common/helpers';
import { Category, CategoryDocument } from '@schemas/category';
import { CoursesService } from '../../microtron/courses/courses.service';
import { CategoriesService } from '../../microtron/categories/categories.service';

@Injectable()
export class SyncLocalService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private configService: ConfigService,
    private coursesService: CoursesService,
    private categoriesService: CategoriesService,
    private dataUtilHelper: DataUtilsHelper,
    private dataGenerateHelper: DataGenerateHelper,
    @InjectModel(Constant.name) private constantModel: Model<ConstantDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}
}
