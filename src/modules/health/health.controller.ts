import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { CustomHealthIndicator } from './health.indicator';

@Controller('health')
export class HealthController {
  /**
   * @ignore
   */
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly customHealthIndicator: CustomHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  /**
   * This route checks application health
   * @returns A storage, memory and database status
   */

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          threshold:
            this.configService.get<number>('MAX_STORAGE_SIZE') * 1024 * 1024,
        }),
      () =>
        this.memory.checkHeap(
          'memory_heap',
          this.configService.get<number>('MAX_HEAP_MEMORY_SIZE') * 1024 * 1024,
        ),
      () =>
        this.memory.checkRSS(
          'memory_rss',
          this.configService.get<number>('MAX_RSS_MEMORY_SIZE') * 1024 * 1024,
        ),
      () => this.customHealthIndicator.postgresIsHealthy(),
    ]);
  }
}
