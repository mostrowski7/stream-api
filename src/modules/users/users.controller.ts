import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  /**
   * @ignore
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * This route registers a new user
   * @param createUserDto User data to create
   * @returns Created user
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
