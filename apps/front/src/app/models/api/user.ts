export class User {
  id = '';
  email = '';
  name = '';
  passwordHash = '';
  role = '';
  createdAt: Date = new Date();
  updatedAt: Date = new Date();

  constructor(init: Partial<User>) {
    Object.assign(this, init);
  }
}
