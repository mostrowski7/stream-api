export class User {
  id: string;
  username: string;
  email: string;
  password: string;
  refreshToken: string;

  constructor(
    id: string,
    username: string,
    email: string,
    password: string,
    refreshToken: string,
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.refreshToken = refreshToken;
  }
}
