import { Injectable } from '@nestjs/common';
import { InternalServerErrorException } from '@nestjs/common/exceptions';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import UsersRepository from './users.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...restCreateUserData } = createUserDto;

    const hashedPassword = await this.hashPassword(password);

    return this.usersRepository.create({
      password: hashedPassword,
      ...restCreateUserData,
    });
  }

  async hashPassword(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword)
      throw new InternalServerErrorException('Cannot hash password');
    return hashedPassword;
  }

  async findByEmail(email: string): Promise<User> {
    return await this.usersRepository.findByEmail(email);
  }

  async getById(id: string): Promise<User> {
    return await this.usersRepository.getById(id);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    return await this.usersRepository.update(id, data);
  }
}
