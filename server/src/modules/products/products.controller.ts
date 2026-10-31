import { Request, Response, NextFunction } from "express";
import { productsService } from "./products.service";

export class ProductsController {
  async listProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const type = req.query.type as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

      const result = await productsService.listProducts({ page, limit, search, type, isActive });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.getProductById(req.params.id as string);
      res.status(200).json({ success: true, data: { product } });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.createProduct(req.body);
      res.status(201).json({ success: true, data: { product } });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productsService.updateProduct(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: { product } });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productsService.deleteProduct(req.params.id as string);
      res.status(200).json({ success: true, data: { result } });
    } catch (error) {
      next(error);
    }
  }

  async addVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productsService.addVariant(req.params.id as string, req.body);
      res.status(201).json({ success: true, data: { variant } });
    } catch (error) {
      next(error);
    }
  }

  async updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variant = await productsService.updateVariant(
        req.params.productId as string,
        req.params.variantId as string,
        req.body
      );
      res.status(200).json({ success: true, data: { variant } });
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productsService.deleteVariant(
        req.params.productId as string,
        req.params.variantId as string
      );
      res.status(200).json({ success: true, data: { result } });
    } catch (error) {
      next(error);
    }
  }
}

export const productsController = new ProductsController();
