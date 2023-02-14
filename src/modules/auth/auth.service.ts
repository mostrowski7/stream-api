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

  /**
   * This method identifies, verify user and signs tokens
   * @param loginDto User email and password
   * @returns A promise with tokens, username and email
   */
  async login(loginDto: LoginDto): Promise<{
    username: string;
    email: string;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = loginDto;

    try {
      const user = await this.usersService.findByEmail(email);

      await this.compareUserPasswords(password, user.password);

      const refreshToken = await this.getRefreshToken(user.id);

      const accessToken = this.getAccessToken({
        sub: user.id,
        email,
        username: user.username,
      });

      return {
        username: user.username,
        email,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  /**
   * This method compares plaintext and hashed password
   * @param plaintext Plaintext user password
   * @param hash Hashed user password
   */
  async compareUserPasswords(plaintext: string, hash: string): Promise<void> {
    const isCorrect = await bcrypt.compare(plaintext, hash);
    if (!isCorrect) throw new UnauthorizedException();
  }

  /**
   * This method identifies and verify if the user can refresh the token
   * @param id User id
   * @param refreshToken Plaintext refresh token
   * @returns A promise with found user
   */
  async getAuthenticatedUser(id: string, refreshToken: string): Promise<User> {
    const user = await this.usersService.getById(id);

    if (user && (await bcrypt.compare(refreshToken, user.refreshToken))) {
      return user;
    }
  }

  /**
   * This method signs jwt access token
   * @param payload Specify what should be in token payload
   * @returns A promise with signed token
   */
  getAccessToken(payload: Payload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION_TIME'),
    });
  }

  /**
   * This method signs and update user refresh token
   * @param sub Token id
   * @returns A promise with signed token
   */
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

  /**
   * This method creates cookie with specific refresh token and expiration time
   * @param refreshToken User refresh token
   * @returns A cookie string
   */
  getRefreshTokenCookie(refreshToken: string): string {
    const expirationTime = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_TIME',
    );

    return `refreshToken=${refreshToken}; Secure; HttpOnly; Path=/; Max-Age=${expirationTime}`;
  }

  /**
   * This method creates log out cookie with empty refresh token
   * @returns A cookie string
   */
  getLogoutRefreshTokenCookie(): string {
    return `refreshToken=; Secure; HttpOnly; Path=/; Max-Age=0`;
  }
}
