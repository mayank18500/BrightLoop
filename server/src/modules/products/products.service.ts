import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import {
  CreateProductInput,
  UpdateProductInput,
  AddVariantInput,
  UpdateVariantInput,
} from "./products.validation";

export class ProductsService {
  /**
   * List products with pagination, search, active filter, and variants.
   */
  async listProducts(params: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    isActive?: boolean;
  }) {
    const { page, limit, search, type, isActive } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          variants: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Enhance each variant with the calculated effective price
    const enrichedProducts = products.map((product) => ({
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        effectivePrice: product.salesPrice.add(v.priceAdjustment),
      })),
    }));

    return {
      products: enrichedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve a single product by ID with variants and effective pricing.
   */
  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!product) {
      throw new AppError("Product not found.", 404);
    }

    return {
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        effectivePrice: product.salesPrice.add(v.priceAdjustment),
      })),
    };
  }

  /**
   * Create a new product with optional initial variants.
   */
  async createProduct(input: CreateProductInput) {
    const { variants, salesPrice, costPrice, ...rest } = input;

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...rest,
          salesPrice: new Prisma.Decimal(salesPrice),
          costPrice: new Prisma.Decimal(costPrice),
          variants: variants && variants.length > 0
            ? {
                create: variants.map((v) => ({
                  name: v.name,
                  priceAdjustment: new Prisma.Decimal(v.priceAdjustment),
                  isActive: v.isActive,
                })),
              }
            : undefined,
        },
        include: {
          variants: true,
        },
      });

      return product;
    });
  }

  /**
   * Update an existing product.
   */
  async updateProduct(id: string, input: UpdateProductInput) {
    await this.getProductById(id);

    const data: Prisma.ProductUpdateInput = {
      ...(input.name && { name: input.name }),
      ...(input.type && { type: input.type }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.salesPrice && { salesPrice: new Prisma.Decimal(input.salesPrice) }),
      ...(input.costPrice && { costPrice: new Prisma.Decimal(input.costPrice) }),
    };

    return prisma.product.update({
      where: { id },
      data,
      include: {
        variants: true,
      },
    });
  }

  /**
   * Delete or deactivate a product.
   * If historical records reference this product, soft-deactivate instead of breaking constraints.
   */
  async deleteProduct(id: string) {
    await this.getProductById(id);

    const hasReferences = await prisma.subscriptionItem.findFirst({
      where: { productId: id },
    });

    if (hasReferences) {
      return prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Add a new variant to an existing product.
   */
  async addVariant(productId: string, input: AddVariantInput) {
    const product = await this.getProductById(productId);

    return prisma.productVariant.create({
      data: {
        productId: product.id,
        name: input.name,
        priceAdjustment: new Prisma.Decimal(input.priceAdjustment),
        isActive: input.isActive,
      },
    });
  }

  /**
   * Update a product variant.
   */
  async updateVariant(productId: string, variantId: string, input: UpdateVariantInput) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new AppError("Variant not found for this product.", 404);
    }

    const data: Prisma.ProductVariantUpdateInput = {
      ...(input.name && { name: input.name }),
      ...(input.priceAdjustment && { priceAdjustment: new Prisma.Decimal(input.priceAdjustment) }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    };

    return prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  }

  /**
   * Delete or deactivate a variant.
   */
  async deleteVariant(productId: string, variantId: string) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new AppError("Variant not found for this product.", 404);
    }

    const hasReferences = await prisma.subscriptionItem.findFirst({
      where: { variantId },
    });

    if (hasReferences) {
      return prisma.productVariant.update({
        where: { id: variantId },
        data: { isActive: false },
      });
    }

    return prisma.productVariant.delete({
      where: { id: variantId },
    });
  }
}

export const productsService = new ProductsService();
