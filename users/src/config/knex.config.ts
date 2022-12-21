import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Knex } from 'knex';

config();

const configService = new ConfigService();

const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: {
    host: configService.get<string>('database.postgresHost'),
    port: configService.get<number>('database.postgresPort'),
    user: configService.get<string>('database.postgresUser'),
    password: configService.get<string>('database.postgresPassword'),
    database: configService.get<string>('database.postgresDb'),
  },
  migrations: {
    extension: 'ts',
    directory: '../migrations',
  },
};

export default knexConfig;
