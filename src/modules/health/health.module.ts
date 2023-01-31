import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { CustomHealthIndicator } from './health.indicator';

@Module({
  imports: [TerminusModule, HttpModule, ConfigModule],
  controllers: [HealthController],
  providers: [CustomHealthIndicator],
})
export class HealthModule {}
