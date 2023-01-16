import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { LoginDto } from './dto/login-dto';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import DatabaseService from '../database/database.service';
import { UsersService } from '../users/users.service';
import UsersRepository from '../users/users.repository';
import * as bcrypt from 'bcrypt';

describe('AuthController', () => {
  let app: INestApplication, loginDto: LoginDto, runQueryMock: jest.Mock;

  beforeEach(async () => {
    runQueryMock = jest.fn();
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
          secretOrPrivateKey: 'secret',
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
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

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  describe('POST /login', () => {
    beforeEach(() => {
      loginDto = {
        email: 'user@gmail.com',
        password: 'password',
      };
    });

    describe('when email is invalid', () => {
      it('should return status 400 and message', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'invalid', password: loginDto.password });

        expect(response.body).toMatchObject({
          statusCode: 400,
          message: expect.arrayContaining(['email must be an email']),
        });
      });
    });

    describe('when password is invalid', () => {
      it('should return status 400 and message', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: loginDto.email, password: '' });

        expect(response.body).toMatchObject({
          statusCode: 400,
          message: expect.arrayContaining([
            'password must be longer than or equal to 8 characters',
          ]),
        });
      });
    });

    describe('when user data is not correct', () => {
      it('should return status 401 and message', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto);

        expect(response.body).toMatchObject({
          statusCode: 401,
          message: 'Unauthorized',
        });
      });
    });

    describe('when successfully sign in', () => {
      beforeEach(() => {
        runQueryMock.mockResolvedValue({
          rowCount: 1,
          rows: [
            {
              email: 'user@gmail.com',
              name: 'user',
              password:
                '$2b$10$wd2FKgUyIztkelRHpkX7RuJN2ZgVMFBTr/BABiaqkSzDs3eZR9YWO',
            },
          ],
        });

        jest
          .spyOn(bcrypt, 'compare')
          .mockImplementation(() => Promise.resolve(true));
      });

      it('should return access token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto);

        expect(response.body).toMatchObject({
          accessToken: expect.any(String),
        });
      });

      it('should return refresh token as cookie', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto);

        const cookies = response.headers['set-cookie'];

        expect(cookies).toEqual(
          expect.arrayContaining([expect.stringMatching(/refreshToken/)]),
        );
      });
    });
  });
});
