import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.raw(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE TABLE users (
            id  UUID DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            refresh_token TEXT,
            PRIMARY KEY (id)
        )
    `);
}

export async function down(knex: Knex): Promise<void> {
  return knex.raw(`
        DROP TABLE users
  `);
}
