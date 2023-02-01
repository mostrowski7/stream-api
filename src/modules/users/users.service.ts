import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common/exceptions';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import UsersRepository from './users.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  /**
   * @ignore
   */
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * This method creates user with hashed password
   * @param createUserDto User data to create
   * @returns A promise with created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...restCreateUserData } = createUserDto;

    const hashedPassword = await this.hashPassword(password);

    return this.usersRepository.create({
      password: hashedPassword,
      ...restCreateUserData,
    });
  }

  /**
   * This method hashes password using bcrypt and salt
   * @param password Plaintext password
   * @returns A promise with hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword)
      throw new InternalServerErrorException('Cannot hash password');
    return hashedPassword;
  }

  /**
   * This method finds user by email
   * @param email User email. Should exists in database
   * @returns A promise with a found user
   */
  async findByEmail(email: string): Promise<User> {
    return await this.usersRepository.findByEmail(email);
  }

  /**
   * This method gets user by id.
   * User with given id should exists in database
   * @param id User id
   * @returns A promise with a found user or if not exists null
   */
  async getById(id: string): Promise<User> {
    return await this.usersRepository.getById(id);
  }

  /**
   * This method updates user data by id
   * User with given id should exists in database
   * @param id User id
   * @param data User data to update
   * @returns A promise without content
   */
  async update(id: string, data: Partial<User>): Promise<void> {
    return await this.usersRepository.update(id, data);
  }
}
