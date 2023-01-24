export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  refreshToken: string;

  constructor(id: string, name: string, email: string, password: string) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.refreshToken = this.refreshToken;
  }
}
