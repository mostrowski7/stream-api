import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login-dto';
import DatabaseService from '../database/database.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import UsersRepository from '../users/users.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
import {
  runQueryMock,
  getUpdateParamsAndColumnsMock,
} from '../database/database.mock';

describe('AuthController', () => {
  const userRow = {
    id: 'd2771ffe-8834-4c16-ba1b-9097e5a9f1d2',
    email: 'user@gmail.com',
    name: 'user',
    password: '$2b$10$E0QnOkL0M7zNDh4jpiViY.TNPGnokaW838iw7HsYWHAkh7FnroskW',
    refreshToken:
      '$2b$10$gI8lA4stVVjPaUGnzLt7vONWTBApWcNNTV32f5L9ZurmyOzhLrshe',
  };
  let app: INestApplication, loginDto: LoginDto, refreshTokenCookie: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
            getUpdateParamsAndColumns: getUpdateParamsAndColumnsMock,
          },
        },
        JwtStrategy,
        JwtRefreshTokenStrategy,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());

    await app.init();
  });

  describe('POST /login', () => {
    beforeEach(() => {
      loginDto = {
        email: 'user@gmail.com',
        password: 'password',
      };

      runQueryMock.mockResolvedValue({
        rowCount: 1,
        rows: [userRow],
      });

      getUpdateParamsAndColumnsMock.mockReturnValue({
        columns: 'refresh_token = $2',
        params: ['hashedRefreshToken'],
      });
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

    describe('when user not found', () => {
      it('should return status 401 and message', async () => {
        runQueryMock.mockResolvedValueOnce({
          rowCount: 0,
          rows: [],
        });

        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'notfound@gmail.com', password: loginDto.password });

        expect(response.body).toMatchObject({
          statusCode: 401,
          message: 'Unauthorized',
        });
      });
    });

    describe('when user exists', () => {
      describe('and when password is not correct', () => {
        it('should return status 401 and message', async () => {
          const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: loginDto.email, password: 'incorrect' });

          expect(response.body).toMatchObject({
            statusCode: 401,
            message: 'Unauthorized',
          });
        });
      });

      describe('and when password is correct', () => {
        beforeEach(() => {
          runQueryMock
            .mockResolvedValueOnce({
              command: 'SELECT',
              rowCount: 1,
              rows: [userRow],
            })
            .mockResolvedValueOnce({
              command: 'UPDATE',
              rowCount: 1,
            });
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

          refreshTokenCookie = cookies[0];

          expect(cookies).toEqual(
            expect.arrayContaining([expect.stringMatching(/refreshToken/)]),
          );
        });
      });
    });
  });

  describe('POST /refresh', () => {
    describe('when refresh token is invalid', () => {
      it('should return status 401', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/refresh')
          .set('Cookie', [`refreshToken=123`]);

        expect(response.body).toMatchObject({ statusCode: 401 });
      });
    });

    describe('when refresh token is valid', () => {
      describe('and when user not found', () => {
        it('should return status 401', async () => {
          runQueryMock.mockResolvedValueOnce({
            rows: [],
          });

          const response = await request(app.getHttpServer())
            .get('/auth/refresh')
            .set('Cookie', [refreshTokenCookie]);

          expect(response.body).toMatchObject({ statusCode: 401 });
        });
      });

      describe('and when refresh token is different than token from database', () => {
        it('should return status 401', async () => {
          runQueryMock.mockResolvedValueOnce({
            rows: [
              {
                ...userRow,
                refreshToken:
                  '$2b$10$DkAnZ1DTQBJLcDpFMFOZ/OAppLY6n1QPRgO4STsLiGTL5XarjX9G2',
              },
            ],
          });

          const response = await request(app.getHttpServer())
            .get('/auth/refresh')
            .set('Cookie', [refreshTokenCookie]);

          expect(response.body).toMatchObject({ statusCode: 401 });
        });
      });

      describe('and when successfully found user with correct refresh token', () => {
        beforeEach(async () => {
          const refreshToken = refreshTokenCookie
            .split('=')[1]
            .split(';')
            .shift();

          const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

          runQueryMock.mockResolvedValue({
            rows: [
              {
                ...userRow,
                refreshToken: hashedRefreshToken,
              },
            ],
          });
        });

        it('should return access token', async () => {
          const response = await request(app.getHttpServer())
            .get('/auth/refresh')
            .set('Cookie', [refreshTokenCookie]);

          expect(response.body).toMatchObject({
            accessToken: expect.any(String),
          });
        });

        it('should return refresh token as cookie', async () => {
          const response = await request(app.getHttpServer())
            .get('/auth/refresh')
            .set('Cookie', [refreshTokenCookie]);

          const cookies = response.headers['set-cookie'];

          expect(cookies).toEqual(
            expect.arrayContaining([expect.stringMatching(/refreshToken/)]),
          );
        });
      });
    });
  });
});
