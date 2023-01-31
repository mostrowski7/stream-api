import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { HealthIndicator, HealthCheckError } from '@nestjs/terminus';
import DatabaseService from '../database/database.service';

@Injectable()
export class CustomHealthIndicator extends HealthIndicator {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  async postgresIsHealthy() {
    try {
      await this.databaseService.runQuery('SELECT 1');
      return this.getStatus('postgres', true);
    } catch (e) {
      throw new HealthCheckError('Postgres failed', 'Unable to execute query');
    }
  }
}
