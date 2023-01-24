import { InternalServerErrorException } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { camelToSnakeCase } from '../../common/transformations/case.utils';
import { CONNECTION_POOL } from './database.module-definition';

@Injectable()
class DatabaseService {
  constructor(@Inject(CONNECTION_POOL) private readonly pool: Pool) {}

  getPool(): Pool {
    return this.pool;
  }

  async runQuery(query: string, params?: unknown[]) {
    return this.pool.query(query, params);
  }

  getUpdateParamsAndColumns(data: unknown): {
    columns: string;
    params: unknown[];
  } {
    if (data.constructor !== Object || Object.entries(data).length === 0)
      throw new InternalServerErrorException(
        'Input data must be an object with at least one key-value pair',
      );

    const columns = Object.keys(data)
      .map((element, index) => {
        const column = camelToSnakeCase(element);

        return `${column} = $${index + 2}`;
      })
      .join(', ');

    return {
      columns,
      params: Object.values(data),
    };
  }
}

export default DatabaseService;
