import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import {
  audioProcessorName,
  loadAllCategoriesName,
  loadAllProductsName,
  loadProductsByCategoryName,
  TAudioProcessorQueue,
  TLoadAllCategoriesProcessorQueue,
  TLoadAllProductsProcessorQueue,
  TLoadProductsByCategoryProcessorQueue,
} from '../consumers';

@Injectable()
export class JobBoardService {
  private readonly logger = new Logger(this.constructor.name);

  private readonly basePath = '/admin/jobs';
  private readonly serverAdapter = new ExpressAdapter();
  private readonly bullBoard: ReturnType<typeof createBullBoard>;

  constructor(
    private configService: ConfigService,
    @InjectQueue(audioProcessorName)
    private audioQueue: TAudioProcessorQueue,
    @InjectQueue(loadAllCategoriesName)
    private loadAllCategoriesQueue: TLoadAllCategoriesProcessorQueue,
    @InjectQueue(loadProductsByCategoryName)
    private loadProductsByCategoryQueue: TLoadProductsByCategoryProcessorQueue,
    @InjectQueue(loadAllProductsName)
    private loadAllProductsQueue: TLoadAllProductsProcessorQueue,
  ) {
    this.serverAdapter.setBasePath(this.basePath);
    this.serverAdapter.setErrorHandler((err) => {
      this.logger.error(err);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: err,
      };
    });

    this.bullBoard = createBullBoard({
      queues: [
        new BullAdapter(this.audioQueue),
        new BullAdapter(this.loadAllCategoriesQueue),
        new BullAdapter(this.loadProductsByCategoryQueue),
        new BullAdapter(this.loadAllProductsQueue),
      ],
      serverAdapter: this.serverAdapter,
    });
  }

  public getBasePath() {
    return this.basePath;
  }

  public getRouter() {
    return this.serverAdapter.getRouter();
  }

  public async addAudioJob() {
    const job = await this.audioQueue.add();
    return {
      id: job.id,
      name: job.queue.name,
      data: job.data,
    };
  }

  public async addLoadAllCategories() {
    const job = await this.loadAllCategoriesQueue.add();
    return {
      id: job.id,
      name: job.queue.name,
      data: job.data,
    };
  }

  public async addLoadProductsByCategory(categoryId: string) {
    const job = await this.loadProductsByCategoryQueue.add({ categoryId });
    return {
      id: job.id,
      name: job.queue.name,
      data: job.data,
    };
  }

  public async addLoadAllProducts() {
    const job = await this.loadAllProductsQueue.add();
    return {
      id: job.id,
      name: job.queue.name,
      data: job.data,
    };
  }
}
