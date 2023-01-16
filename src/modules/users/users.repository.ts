import { Injectable } from '@nestjs/common';
import {
  ConflictException,
  BadRequestException,
} from '@nestjs/common/exceptions';
import { plainToInstance } from 'class-transformer';
import DatabaseErrorCode from '../database/database.errors';
import DatabaseService from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const databaseResponse = await this.databaseService.runQuery(
        `
         INSERT INTO users (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, name, email
       `,
        [createUserDto.name, createUserDto.email, createUserDto.password],
      );
      return plainToInstance(User, databaseResponse.rows[0]);
    } catch (error) {
      if (error?.code === DatabaseErrorCode.UniqueViolation)
        throw new ConflictException('User already exists');
      if (error?.code === DatabaseErrorCode.NotNullConstraint)
        throw new BadRequestException('Some fields are empty');
      throw error;
    }
  }
}

export default UsersRepository;
