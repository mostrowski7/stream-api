import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login-dto';
import { Payload } from './auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const user = await this.usersService.findByEmail(email);

      await this.compareUserPasswords(password, user.password);

      return {
        accessToken: this.jwtSign({ sub: user.id, email, name: user.name }),
        refreshToken: this.getRefreshToken(user.id),
      };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async compareUserPasswords(plaintext: string, hash: string): Promise<void> {
    const isCorrect = await bcrypt.compare(plaintext, hash);
    if (!isCorrect) throw new UnauthorizedException();
  }

  jwtSign(payload: Payload): string {
    return this.jwtService.sign(payload);
  }

  getRefreshToken(sub: string): string {
    return this.jwtService.sign(
      {
        sub,
      },
      {
        secret: this.configService.get<string>('app.jwtRefreshSecret'),
        expiresIn: '1d',
      },
    );
  }
}
