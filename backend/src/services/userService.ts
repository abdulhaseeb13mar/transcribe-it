import {
  CreateUserInput,
  UpdateUserInput,
  CreateSuperAdminInput,
} from "../types";
import { prisma } from "../lib/prisma";
import { User, UserRole } from "@prisma/client";

export class UserService {
  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          organizationId: userData.organizationId,
        },
      });

      return user;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("User with this email already exists");
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      return user;
    } catch (error: any) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      return user;
    } catch (error: any) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async updateUser(id: string, updates: UpdateUserInput): Promise<User | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: updates,
      });

      return user;
    } catch (error: any) {
      if (error.code === "P2025") {
        return null; // User not found
      }
      if (error.code === "P2002") {
        throw new Error("Email already in use");
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });

      return true;
    } catch (error: any) {
      if (error.code === "P2025") {
        return false; // User not found
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });

      return users;
    } catch (error: any) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  }

  async createSuperAdmin(userData: CreateSuperAdminInput): Promise<User> {
    try {
      // Check if a super admin already exists
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { role: UserRole.SUPER_ADMIN },
      });

      if (existingSuperAdmin) {
        throw new Error("Super admin already exists");
      }

      const superAdmin = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: UserRole.SUPER_ADMIN,
          organizationId: null, // Super admin doesn't belong to any organization
        },
      });

      return superAdmin;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("User with this email already exists");
      }
      throw new Error(`Failed to create super admin: ${error.message}`);
    }
  }

  async checkSuperAdminExists(): Promise<boolean> {
    try {
      const superAdmin = await prisma.user.findFirst({
        where: { role: UserRole.SUPER_ADMIN },
      });

      return !!superAdmin;
    } catch (error: any) {
      throw new Error(
        `Failed to check super admin existence: ${error.message}`
      );
    }
  }
}
