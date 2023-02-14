import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test as NestTest, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/modules/app/app.module';
import DatabaseService from '../src/modules/database/database.service';
import { CreateUserDto } from '../src/modules/users/dto/create-user.dto';
import { UsersController } from '../src/modules/users/users.controller';
import UsersRepository from '../src/modules/users/users.repository';
import { UsersService } from '../src/modules/users/users.service';
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication,
    createUserDto: CreateUserDto,
    databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await NestTest.createTestingModule({
      imports: [AppModule],
      controllers: [UsersController],
      providers: [UsersService, UsersRepository],
    }).compile();

    databaseService = module.get(DatabaseService);

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await databaseService.runQuery('DELETE FROM users');
    await databaseService.getPool().end();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    beforeEach(() => {
      createUserDto = {
        username: 'username',
        email: 'user@gmail.com',
        password: 'password',
      };
    });

    describe('when successfully register a user', () => {
      it('should return status 201 and user data', async () => {
        const response = await request(app.getHttpServer())
          .post('/users')
          .send(createUserDto);

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.stringMatching(
            /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/,
          ),
          username: createUserDto.username,
          email: createUserDto.email,
        });
      });

      it('should return data without password', async () => {
        const response = await request(app.getHttpServer())
          .post('/users')
          .send(createUserDto);

        expect(response.body).not.toHaveProperty('password');
      });
    });

    describe('when user already exists', () => {
      it('should return status 409 and message', async () => {
        await request(app.getHttpServer()).post('/users').send(createUserDto);
        const response = await request(app.getHttpServer())
          .post('/users')
          .send(createUserDto);

        expect(response.body).toMatchObject({
          statusCode: 409,
          message: 'User already exists',
        });
      });
    });

    describe('when email is invalid', () => {
      it('should return status 400 and message', async () => {
        const response = await request(app.getHttpServer())
          .post('/users')
          .send({
            username: createUserDto.username,
            password: createUserDto.password,
            email: 'invalid',
          });

        expect(response.body).toMatchObject({
          statusCode: 400,
          message: expect.arrayContaining(['email must be an email']),
        });
      });
    });
  });
});
