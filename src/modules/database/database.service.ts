import { InternalServerErrorException } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { camelToSnakeCase } from '../../common/transformations/case.utils';
import { CONNECTION_POOL } from './database.module-definition';

@Injectable()
class DatabaseService {
  /**
   * @ignore
   */
  constructor(@Inject(CONNECTION_POOL) private readonly pool: Pool) {}

  /**
   * This method gets postgres pool instance
   * @returns A postgres pool instance
   */
  getPool(): Pool {
    return this.pool;
  }

  /**
   * This method runs custom postgres query
   * @param query Query string with included parameters($1, $2, ...$n)
   * @param params Array of parameters
   * @example query: Select * from 'users' WHERE user.id = $1
   * @example params: [1]
   * @returns A promise with query result
   */
  async runQuery(query: string, params?: unknown[]) {
    return this.pool.query(query, params);
  }

  /**
   * This method transforms object properties
   * to a proper query columns string with parameters indexes
   * @param data Object to update
   * @returns A query columns and parameters
   */
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
