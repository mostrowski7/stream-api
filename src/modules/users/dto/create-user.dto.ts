import { ApiProperty } from '@nestjs/swagger/dist';
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    default: 'name',
  })
  @IsString()
  @Length(3, 50)
  name: string;

  @ApiProperty({
    default: 'name@test.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    default: 'password',
  })
  @IsString()
  @Length(8, 50)
  password: string;
}
