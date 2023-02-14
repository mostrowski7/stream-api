import {
  ConflictException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test as NestTest, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as request from 'supertest';
import { CreateUserDto } from './dto/create-user.dto';
import UsersRepository from './users.repository';
import DatabaseService from '../database/database.service';
import { v4 as uuid } from 'uuid';

describe('UsersController', () => {
  let app: INestApplication,
    createUserDto: CreateUserDto,
    runQueryMock: jest.Mock;

  beforeEach(async () => {
    runQueryMock = jest.fn();
    const module: TestingModule = await NestTest.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        UsersRepository,
        {
          provide: DatabaseService,
          useValue: {
            runQuery: runQueryMock,
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
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

    describe('when created successfully', () => {
      beforeEach(() => {
        const userRawData = {
          id: uuid(),
          username: createUserDto.username,
          email: createUserDto.email,
        };

        runQueryMock.mockResolvedValue({
          rows: [userRawData],
        });
      });

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
      beforeEach(() => {
        runQueryMock.mockRejectedValue(
          new ConflictException('User already exists'),
        );
      });
      it('should return status 409 and message', async () => {
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
