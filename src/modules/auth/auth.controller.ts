import { Body, Controller, Post, Get, Req } from '@nestjs/common';
import { Res, HttpCode, UseGuards } from '@nestjs/common/decorators';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login-dto';
import JwtRefreshTokenGuard from './guards/jwt-refresh-token.guard';
import { RequestWithUser } from './auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto,
    );

    const refreshTokenCookie = await this.authService.getRefreshTokenCookie(
      refreshToken,
    );

    res.set('Set-Cookie', refreshTokenCookie);

    return { accessToken };
  }

  @UseGuards(JwtRefreshTokenGuard)
  @HttpCode(200)
  @Get('refresh')
  async refresh(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { id, name, email } = req.user;

    const accessToken = this.authService.getAccessToken({
      sub: id,
      email,
      name,
    });

    const refreshToken = await this.authService.getRefreshToken(id);

    const refreshTokenCookie = await this.authService.getRefreshTokenCookie(
      refreshToken,
    );

    res.set('Set-Cookie', refreshTokenCookie);

    return { accessToken };
  }
}
