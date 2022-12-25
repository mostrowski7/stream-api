import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Knex } from 'knex';

config({ path: '../../.env' });

const configService = new ConfigService();

const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: {
    host: configService.get<string>('POSTGRES_HOST'),
    port: configService.get<number>('POSTGRES_PORT'),
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
