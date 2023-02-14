import { ConfigModule } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import DatabaseService from '../database/database.service';
import { User } from '../users/entities/user.entity';
import UsersRepository from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import {
  runQueryMock,
  getUpdateParamsAndColumnsMock,
} from '../database/database.mock';

describe('AuthService', () => {
  const userRow = {
    id: 'd2771ffe-8834-4c16-ba1b-9097e5a9f1d2',
    email: 'user@gmail.com',
    username: 'user',
    password: '$2b$10$E0QnOkL0M7zNDh4jpiViY.TNPGnokaW838iw7HsYWHAkh7FnroskW',
    refreshToken:
      '$2b$10$gI8lA4stVVjPaUGnzLt7vONWTBApWcNNTV32f5L9ZurmyOzhLrshe',
  };
  let authService: AuthService, loginDto: Pick<User, 'email' | 'password'>;

  beforeEach(async () => {
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
            getUpdateParamsAndColumns: getUpdateParamsAndColumnsMock,
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
    });

    describe('when user not found', () => {
      it('should throws unauthorized exception', async () => {
        runQueryMock.mockResolvedValueOnce({
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
          rows: [userRow],
        });
      });

      describe('and when password is wrong', () => {
        it('should throws unauthorized exception', async () => {
          await expect(
            authService.login({ email: loginDto.email, password: 'wrong' }),
          ).rejects.toThrow(new UnauthorizedException());
        });
      });

      describe('and when password is correct', () => {
        it('should return access token and refresh token', async () => {
          getUpdateParamsAndColumnsMock.mockReturnValue({
            columns: 'refresh_token = $2',
            params: ['hashedRefreshToken'],
          });

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
