import { ConfigModule } from '@nestjs/config';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuid } from 'uuid';
import DatabaseService from '../database/database.service';
import { User } from '../users/entities/user.entity';
import UsersRepository from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  const hashedPassword =
    '$2b$12$vrs4J5zfhOiOw3vjgDuVkOMF8QblLoff9p3FrmceXfy.2nZMvECJq';
  let authService: AuthService,
    runQueryMock: jest.Mock,
    loginDto: Pick<User, 'email' | 'password'>,
    foundUser: User;

  beforeEach(async () => {
    runQueryMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
          secretOrPrivateKey: 'secret',
        }),
      ],
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

    authService = module.get<AuthService>(AuthService);
  });

  describe('login method', () => {
    beforeEach(() => {
      loginDto = {
        email: 'user@gmail.com',
        password: 'password',
      };

      foundUser = {
        id: uuid(),
        email: loginDto.email,
        name: 'user',
        password: hashedPassword,
      };
    });
    describe('when user not found', () => {
      it('should throws unauthorized exception', async () => {
        runQueryMock.mockResolvedValue({
          rowCount: 0,
        });

        await expect(authService.login(loginDto)).rejects.toThrow(
          new UnauthorizedException(),
        );
      });
    });

    describe('when user exists', () => {
      beforeEach(() => {
        runQueryMock.mockResolvedValue({
          rowCount: 1,
          rows: [foundUser],
        });
      });

      describe('and when password is wrong', () => {
        it('should throws unauthorized exception', async () => {
          jest
            .spyOn(bcrypt, 'compare')
            .mockImplementation(() => Promise.resolve(false));

          await expect(authService.login(loginDto)).rejects.toThrow(
            new UnauthorizedException(),
          );
        });
      });

      describe('and when password is correct', () => {
        it('should return access token and refresh token', async () => {
          jest
            .spyOn(bcrypt, 'compare')
            .mockImplementation(() => Promise.resolve(true));

          const result = await authService.login(loginDto);

          expect(result).toMatchObject({
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          });
        });
      });
    });
  });
});
