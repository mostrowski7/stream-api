import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Knex } from 'knex';
import { Environment } from './env.validation';

config({ path: '../../.env' });

const configService = new ConfigService();

const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: {
    host:
      configService.get('NODE_ENV') === Environment.Test
        ? configService.get('POSTGRES_TEST_HOST')
        : configService.get('POSTGRES_HOST'),
    port: configService.get('POSTGRES_PORT'),
    user: configService.get<string>('POSTGRES_USER'),
    password: configService.get<string>('POSTGRES_PASSWORD'),
    database: configService.get<string>('POSTGRES_DB'),
  },
  migrations: {
    extension: 'ts',
    directory: '../migrations',
  },
};

export default knexConfig;
