import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login-dto';
import { Payload } from './auth.interface';
import { User } from '../users/entities/user.entity';

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

      const refreshToken = await this.getRefreshToken(user.id);

      const accessToken = this.getAccessToken({
        sub: user.id,
        email,
        name: user.name,
      });

      return {
        name: user.name,
        email,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  async compareUserPasswords(plaintext: string, hash: string): Promise<void> {
    const isCorrect = await bcrypt.compare(plaintext, hash);
    if (!isCorrect) throw new UnauthorizedException();
  }

  async getAuthenticatedUser(id: string, refreshToken: string): Promise<User> {
    const user = await this.usersService.getById(id);

    if (user && (await bcrypt.compare(refreshToken, user.refreshToken))) {
      return user;
    }
  }

  getAccessToken(payload: Payload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME'),
    });
  }

  async getRefreshToken(sub: string): Promise<string> {
    const refreshToken = this.jwtService.sign(
      {
        sub,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION_TIME',
        ),
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.usersService.update(sub, {
      refreshToken: hashedRefreshToken,
    });

    return refreshToken;
  }

  async getRefreshTokenCookie(refreshToken: string): Promise<string> {
    const expirationTime = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_TIME',
    );

    return `refreshToken=${refreshToken}; Secure; HttpOnly; Path=/; Max-Age=${expirationTime}`;
  }
}
