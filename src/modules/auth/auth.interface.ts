import { Request } from 'express';
import { User } from '../users/entities/user.entity';

export interface Payload {
  sub: string;
  name: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: User;
}
