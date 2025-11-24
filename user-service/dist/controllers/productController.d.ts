import type { Request, Response } from 'express';
export declare class ProductController {
    createProduct(req: Request, res: Response): Promise<void>;
    getProductById(req: Request, res: Response): Promise<void>;
    getAllProducts(req: Request, res: Response): Promise<void>;
    updateProduct(req: Request, res: Response): Promise<void>;
    deleteProduct(req: Request, res: Response): Promise<void>;
    hardDeleteProduct(req: Request, res: Response): Promise<void>;
    restoreProduct(req: Request, res: Response): Promise<void>;
}
declare const _default: ProductController;
export default _default;
//# sourceMappingURL=productController.d.ts.map