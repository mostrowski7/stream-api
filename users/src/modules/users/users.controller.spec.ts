import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test as NestTest, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as request from 'supertest';
import { CreateUserDto } from './dto/create-user.dto';
import UsersRepository from './users.repository';
import { AppModule } from '../app/app.module';
import DatabaseService from '../database/database.service';

describe('UsersController', () => {
  let app: INestApplication,
    createUserDto: CreateUserDto,
    databaseService: DatabaseService,
    usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await NestTest.createTestingModule({
      imports: [AppModule],
      controllers: [UsersController],
      providers: [UsersService, UsersRepository],
    })
      .overrideProvider(UsersService)
      .useValue(usersService)
      .compile();

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
        name: 'name',
        email: 'user@gmail.com',
        password: 'password',
      };
    });

    describe('when created successfully', () => {
      it('should return status 201 and user data', async () => {
        const response = await request(app.getHttpServer())
          .post('/users')
          .send(createUserDto);

        expect(response.statusCode).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.stringMatching(
            /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/,
          ),
          name: createUserDto.name,
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

    describe('when throw an error', () => {
      it('should return status 409 and message user already exists', async () => {
        await request(app.getHttpServer()).post('/users').send(createUserDto);
        const response = await request(app.getHttpServer())
          .post('/users')
          .send(createUserDto);

        expect(response.body).toMatchObject({
          statusCode: 409,
          message: 'User already exists',
        });
      });

      it('should return status 400 and message invalid email', async () => {
        const response = await request(app.getHttpServer())
          .post('/users')
          .send({ ...createUserDto, email: 'invalid' });

        expect(response.body).toMatchObject({
          statusCode: 400,
          message: expect.arrayContaining(['email must be an email']),
        });
      });
    });
  });
});
