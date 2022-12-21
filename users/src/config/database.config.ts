import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  postgresHost: process.env.POSTGRES_HOST,
  postgresPort: parseInt(process.env.POSTGRES_PORT, 10),
  postgresUser: process.env.POSTGRES_USER,
  postgresPassword: process.env.POSTGRES_PASSWORD,
  postgresDb: process.env.POSTGRES_DB,
}));
