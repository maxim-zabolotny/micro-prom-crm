/*external modules*/
import Redis, { Redis as TRedis, RedisOptions } from 'ioredis';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(this.constructor.name);
  private connection: TRedis;

  private readonly redisOptions!: RedisOptions;

  constructor(private configService: ConfigService) {
    this.redisOptions = {
      port: this.configService.get('redis.port'),
      host: this.configService.get('redis.host'),
      keyPrefix: `${this.configService.get('env')}:`,
    };
  }

  async onModuleInit() {
    this.createConnection();
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  private createConnection() {
    this.connection = new Redis(this.redisOptions);

    this.logger.debug('Created connection to Redis', this.redisOptions);
  }

  private async closeConnection() {
    await this.connection.quit();

    this.logger.debug('Closed connection to Redis', this.redisOptions);
  }

  public getConnection() {
    return this.connection;
  }
}
