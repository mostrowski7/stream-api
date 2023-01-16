import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import UsersRepository from './users.repository';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common/exceptions';
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

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async hashPassword(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 12);
    if (!hashedPassword)
      throw new InternalServerErrorException('Cannot hash password');
    return hashedPassword;
  }
}
