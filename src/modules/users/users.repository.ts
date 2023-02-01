import { Injectable } from '@nestjs/common';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common/exceptions';
import { plainToInstance } from 'class-transformer';
import DatabaseErrorCode from '../database/database.errors';
import DatabaseService from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
class UsersRepository {
  /**
   * @ignore
   */
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * This method runs query and create a new user
   * Username and email should be unique
   * @param createUserDto User data to create
   * @returns A promise with created user id, name and email
   */
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

  /**
   * This method runs query and select user by email
   * @param email User email
   * @returns A promise with found user
   */
  async findByEmail(email: string): Promise<User> {
    const databaseResponse = await this.databaseService.runQuery(
      `
        SELECT id, email, name, password, refresh_token as "refreshToken"
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    if (databaseResponse?.rowCount === 0)
      throw new NotFoundException('User not found');

    return plainToInstance(User, databaseResponse?.rows[0]);
  }

  /**
   * This method runs query and select user by id
   * @param id User id
   * @returns A promise with found user
   */
  async getById(id: string): Promise<User> {
    const databaseResponse = await this.databaseService.runQuery(
      `
        SELECT id, email, name, password, refresh_token as "refreshToken"
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    return plainToInstance(User, databaseResponse?.rows[0]);
  }

  /**
   * This method runs query and update user data by id
   * @param id User id
   * @param data User data to update
   */
  async update(id: string, data: Partial<User>): Promise<void> {
    const { params, columns } =
      this.databaseService.getUpdateParamsAndColumns(data);

    const databaseResponse = await this.databaseService.runQuery(
      `
      UPDATE users
      SET ${columns}
      WHERE id = $1
    `,
      [id, ...params],
    );

    if (databaseResponse.rowCount === 0)
      throw new InternalServerErrorException('Cannot update user');
  }
}

export default UsersRepository;
