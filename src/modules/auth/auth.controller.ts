import { Body, Controller, Post } from '@nestjs/common';
import { Res, HttpCode } from '@nestjs/common/decorators';
import { Public } from '../../common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }
}
