import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { AuthenticatedUser } from "../../middleware/auth.middleware";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";

export class CustomersService {
  async listCustomers(params: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (params.search) {
      where.OR = [
        { companyName: { contains: params.search, mode: "insensitive" } },
        { contactName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { companyName: "asc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, isActive: true },
          },
          _count: {
            select: {
              quotations: true,
              subscriptions: true,
              invoices: true,
            },
          },
        },
      }),
    ]);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(id: string, currentUser: AuthenticatedUser) {
    // If customer role, only allow viewing own customer record
    if (currentUser.role === Role.CUSTOMER && currentUser.customerId !== id) {
      throw new AppError("Access denied. You can only view your own customer profile.", 403);
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true } },
        quotations: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { plan: true },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new AppError("Customer not found.", 404);
    }

    return customer;
  }

  async createCustomer(data: {
    companyName: string;
    contactName: string;
    email: string;
    phone?: string;
    billingAddress?: string;
    taxId?: string;
    password?: string;
  }) {
    // Check if customer or user exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: data.email },
    });
    if (existingCustomer) {
      throw new AppError("A customer with this email already exists.", 409);
    }

    return prisma.$transaction(async (tx) => {
      // Find or create User
      let user = await tx.user.findUnique({ where: { email: data.email } });
      if (!user) {
        const passwordHash = await bcrypt.hash(data.password || "TempCustomerPass@123", 10);
        user = await tx.user.create({
          data: {
            email: data.email,
            passwordHash,
            name: data.contactName,
            role: Role.CUSTOMER,
            isActive: true,
          },
        });
      }

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          companyName: data.companyName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          billingAddress: data.billingAddress,
          taxId: data.taxId,
          isActive: true,
        },
      });

      return customer;
    });
  }
}

export const customersService = new CustomersService();
