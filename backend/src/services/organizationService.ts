import { prisma } from "../lib/prisma";
import { Organization } from "@prisma/client";

export interface CreateOrganizationInput {
  name: string;
  credits?: number;
}

export class OrganizationService {
  async createOrganization(
    orgData: CreateOrganizationInput
  ): Promise<Organization> {
    try {
      const organization = await prisma.organization.create({
        data: {
          name: orgData.name,
          credits: orgData.credits || 0,
        },
      });

      return organization;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Organization with this name already exists");
      }
      throw new Error(`Failed to create organization: ${error.message}`);
    }
  }

  async findOrganizationById(id: string): Promise<Organization | null> {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id },
        include: {
          users: true,
          billing: true,
          creditUsage: true,
        },
      });

      return organization;
    } catch (error: any) {
      throw new Error(`Failed to find organization: ${error.message}`);
    }
  }

  async findOrganizationByName(name: string): Promise<Organization | null> {
    try {
      const organization = await prisma.organization.findFirst({
        where: { name },
      });

      return organization;
    } catch (error: any) {
      throw new Error(`Failed to find organization: ${error.message}`);
    }
  }

  async updateOrganization(
    id: string,
    updates: Partial<CreateOrganizationInput>
  ): Promise<Organization | null> {
    try {
      const organization = await prisma.organization.update({
        where: { id },
        data: updates,
      });

      return organization;
    } catch (error: any) {
      if (error.code === "P2025") {
        return null; // Organization not found
      }
      if (error.code === "P2002") {
        throw new Error("Organization name already in use");
      }
      throw new Error(`Failed to update organization: ${error.message}`);
    }
  }

  async deleteOrganization(id: string): Promise<boolean> {
    try {
      await prisma.organization.delete({
        where: { id },
      });

      return true;
    } catch (error: any) {
      if (error.code === "P2025") {
        return false; // Organization not found
      }
      throw new Error(`Failed to delete organization: ${error.message}`);
    }
  }

  async getAllOrganizations(): Promise<Organization[]> {
    try {
      const organizations = await prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        // include: {
        //   users: true,
        //   billing: true,
        // },
      });

      return organizations;
    } catch (error: any) {
      throw new Error(`Failed to get organizations: ${error.message}`);
    }
  }
}
