import { User } from "../types";

// Mock database for demonstration
const users: User[] = [];

export class UserService {
  async createUser(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">
  ): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return users.find((user) => user.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    return users.find((user) => user.id === id) || null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      return null;
    }

    const existingUser = users[userIndex];
    users[userIndex] = {
      ...existingUser,
      ...updates,
      updatedAt: new Date(),
    };

    return users[userIndex] || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      return false;
    }

    users.splice(userIndex, 1);
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return users;
  }
}
