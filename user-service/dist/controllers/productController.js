"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const productService_1 = __importDefault(require("../services/productService"));
class ProductController {
    async createProduct(req, res) {
        try {
            const productData = req.body;
            const product = await productService_1.default.createProduct(productData);
            res.status(201).json({
                success: true,
                data: product,
                message: 'Product created successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create product';
            console.error('Error creating product:', error);
            res.status(500).json({
                success: false,
                message: message || 'Failed to create product',
            });
        }
    }
    async getProductById(req, res) {
        try {
            const id = req.params['id'];
            const product = await productService_1.default.getProductById(id);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: product,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get product';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async getAllProducts(req, res) {
        try {
            const validatedQuery = req.validatedQuery || req.query;
            const page = validatedQuery['page'] ?? 1;
            const limit = validatedQuery['limit'] ?? 10;
            const filters = {};
            if (validatedQuery['search'] && typeof validatedQuery['search'] === 'string') {
                filters.search = validatedQuery['search'];
            }
            if (validatedQuery['name'] && typeof validatedQuery['name'] === 'string') {
                filters.name = validatedQuery['name'];
            }
            if (validatedQuery['description'] && typeof validatedQuery['description'] === 'string') {
                filters.description = validatedQuery['description'];
            }
            if (validatedQuery['price_from'] !== undefined) {
                const priceFrom = Number(validatedQuery['price_from']);
                if (!isNaN(priceFrom)) {
                    filters.price_from = priceFrom;
                }
            }
            if (validatedQuery['price_to'] !== undefined) {
                const priceTo = Number(validatedQuery['price_to']);
                if (!isNaN(priceTo)) {
                    filters.price_to = priceTo;
                }
            }
            if (validatedQuery['category_id'] !== undefined) {
                const categoryId = Number(validatedQuery['category_id']);
                if (!isNaN(categoryId)) {
                    filters.category_id = categoryId;
                }
            }
            if (validatedQuery['include_deleted'] !== undefined) {
                filters.include_deleted =
                    validatedQuery['include_deleted'] === true || validatedQuery['include_deleted'] === 'true';
            }
            if (validatedQuery['fields'] && typeof validatedQuery['fields'] === 'string') {
                filters.fields = validatedQuery['fields'];
            }
            if (validatedQuery['include'] && typeof validatedQuery['include'] === 'string') {
                filters.include = validatedQuery['include'];
            }
            const result = await productService_1.default.getAllProducts(page, limit, filters);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get products';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async updateProduct(req, res) {
        try {
            const id = req.params['id'];
            const productData = req.body;
            const product = await productService_1.default.updateProduct(id, productData);
            if (!product) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: product,
                message: 'Product updated successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update product';
            console.error('Error updating product:', error);
            res.status(500).json({
                success: false,
                message: message || 'Failed to update product',
            });
        }
    }
    async deleteProduct(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await productService_1.default.deleteProduct(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Product deleted successfully (soft delete)',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete product';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async hardDeleteProduct(req, res) {
        try {
            const id = req.params['id'];
            const deleted = await productService_1.default.hardDeleteProduct(id);
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Product permanently deleted from database',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to hard delete product';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
    async restoreProduct(req, res) {
        try {
            const id = req.params['id'];
            const restored = await productService_1.default.restoreProduct(id);
            if (!restored) {
                res.status(404).json({
                    success: false,
                    message: 'Product not found or not deleted',
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: 'Product restored successfully',
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to restore product';
            res.status(500).json({
                success: false,
                message,
            });
        }
    }
}
exports.ProductController = ProductController;
exports.default = new ProductController();
//# sourceMappingURL=productController.js.map