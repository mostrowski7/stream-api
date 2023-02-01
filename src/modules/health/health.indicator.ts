import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { HealthIndicator, HealthCheckError } from '@nestjs/terminus';
import DatabaseService from '../database/database.service';

@Injectable()
export class CustomHealthIndicator extends HealthIndicator {
  /**
   * @ignore
   */
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  /**
   * This method checks if database is healthy
   * @returns
   */
  async postgresIsHealthy() {
    try {
      await this.databaseService.runQuery('SELECT 1');
      return this.getStatus('postgres', true);
    } catch (e) {
      throw new HealthCheckError('Postgres failed', 'Unable to execute query');
    }
  }
}
