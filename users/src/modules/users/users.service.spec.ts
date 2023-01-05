import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { v4 as uuid } from 'uuid';
import UsersRepository from './users.repository';
import { InternalServerErrorException } from '@nestjs/common';

describe('UsersService', () => {
  const createUserData: CreateUserDto = {
    name: 'user',
    email: 'user@gmail.com',
    password: 'password123',
  };
  let usersService: UsersService;
  let createUserMock: jest.Mock;

  beforeEach(async () => {
    createUserMock = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            create: createUserMock,
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  describe('UsersService.create method', () => {
    let createdUser: User;

    beforeEach(async () => {
      createdUser = {
        id: uuid(),
        name: 'user',
        email: 'user@gmail.com',
        password:
          '$2b$10$wd2FKgUyIztkelRHpkX7RuJN2ZgVMFBTr/BABiaqkSzDs3eZR9YWO',
      };
    });

    it('should be called with expected params', async () => {
      const createUserSpy = jest.spyOn(usersService, 'create');
      await usersService.create(createUserData);
      expect(createUserSpy).toHaveBeenCalledWith(createUserData);
    });

    it('should return created user data', async () => {
      createUserMock.mockResolvedValue(createdUser);
      const result = await usersService.create(createUserData);
      expect(result).toEqual(createdUser);
    });

    it('should throws an error when password hash is not correct', async () => {
      createUserMock.mockRejectedValue(
        new InternalServerErrorException('Cannot hash password'),
      );
      try {
        usersService.create({
          name: null,
          email: createUserData.email,
          password: createUserData.password,
        });
      } catch (e) {
        expect(e).rejects.toThrow(
          new InternalServerErrorException('Cannot hash password'),
        );
      }
    });
  });
});
