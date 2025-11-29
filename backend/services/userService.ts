export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export class UserService {
  async getAll(): Promise<User[]> {
    return [];
  }

  async getById(id: string): Promise<User | null> {
    console.log(`Getting user by id: ${id}`);
    return null;
  }

  async create(data: Omit<User, "id">): Promise<User> {
    return {
      id: crypto.randomUUID(),
      ...data,
    };
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    console.log(`Updating user: ${id}`, data);
    return null;
  }

  async delete(id: string): Promise<boolean> {
    console.log(`Deleting user: ${id}`);
    return false;
  }
}

export const userService = new UserService();
