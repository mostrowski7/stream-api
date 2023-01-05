import { Test, TestingModule } from '@nestjs/testing';
import DatabaseService from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import UsersRepository from './users.repository';
import { v4 as uuid } from 'uuid';
import { ConflictException } from '@nestjs/common/exceptions';
import DatabaseErrorCode from '../database/database.errors';

describe('UsersRepository', () => {
  let runQueryMock: jest.Mock;
  let usersRepository: UsersRepository;
  const createUserData: CreateUserDto = {
    name: 'user',
    email: 'user@gmail.com',
    password: 'password123',
  };

  beforeEach(async () => {
    runQueryMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: DatabaseService,
          useValue: {
            runQuery: runQueryMock,
          },
        },
      ],
    }).compile();
    usersRepository = module.get(UsersRepository);
  });

  describe('UsersRepository.create method', () => {
    describe('when database return valid data', () => {
      let createdUser: User;

      beforeEach(() => {
        createdUser = {
          id: uuid(),
          name: 'user',
          email: 'user@gmail.com',
          password:
            '$2b$10$wd2FKgUyIztkelRHpkX7RuJN2ZgVMFBTr/BABiaqkSzDs3eZR9YWO',
        };
        runQueryMock.mockResolvedValue({
          rows: [createdUser],
        });
      });

      it('should return instance of User', async () => {
        const result = await usersRepository.create(createUserData);
        expect(result instanceof User).toBe(true);
      });

      it('should return user data', async () => {
        const result = await usersRepository.create(createUserData);
        expect(result).toEqual(createdUser);
      });
    });

    describe('when database throws unique violation error', () => {
      beforeEach(() => {
        runQueryMock.mockRejectedValue({
          code: DatabaseErrorCode.UniqueViolation,
        });
      });

      it('should throw user already exists conflict exception', async () => {
        const result = usersRepository.create(createUserData);
        expect(result).rejects.toThrow(
          new ConflictException('User already exists'),
        );
      });
    });

    describe('when database throws not null constraint error', () => {
      beforeEach(() => {
        runQueryMock.mockRejectedValue({
          code: DatabaseErrorCode.NotNullConstraint,
        });
      });

      it('should throw some fields are empty bad request exception', async () => {
        const result = usersRepository.create(createUserData);
        expect(result).rejects.toThrow(
          new ConflictException('Some fields are empty'),
        );
      });
    });
  });
});
