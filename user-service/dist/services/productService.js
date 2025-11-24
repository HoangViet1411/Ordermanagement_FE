"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const sequelize_1 = require("sequelize");
const query_builders_1 = require("../utils/query-builders");
class ProductService {
    async createProduct(productData) {
        const product = await Product_1.default.create({
            name: productData.name,
            description: productData.description !== undefined ? productData.description : null,
            price: productData.price,
            quantity: productData.quantity ?? 0,
        });
        return this.mapToProductResponse(product);
    }
    async getProductById(id) {
        const product = await Product_1.default.findByPk(id, {
            attributes: ['id', 'name', 'price', 'description', 'quantity'],
        });
        return product ? this.mapToProductResponse(product) : null;
    }
    async getAllProducts(page = 1, limit = 10, filters = {}) {
        const pageNumber = Math.max(1, page);
        const noPagination = limit === 0;
        const pageSize = noPagination ? 0 : Math.max(1, Math.min(100, limit));
        const offset = noPagination ? 0 : (pageNumber - 1) * pageSize;
        const whereConditions = [];
        if (filters.search && filters.search.trim()) {
            const searchTerm = `%${filters.search.trim()}%`;
            whereConditions.push({
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.like]: searchTerm } },
                    { description: { [sequelize_1.Op.like]: searchTerm } },
                ],
            });
        }
        if (filters.name && filters.name.trim()) {
            const nameFilter = filters.name.trim();
            whereConditions.push({
                name: { [sequelize_1.Op.like]: `%${nameFilter}%` },
            });
        }
        if (filters.description && filters.description.trim()) {
            const descriptionFilter = filters.description.trim();
            whereConditions.push({
                description: { [sequelize_1.Op.like]: `%${descriptionFilter}%` },
            });
        }
        if (filters.price_from !== undefined || filters.price_to !== undefined) {
            const priceCondition = {};
            if (filters.price_from !== undefined && filters.price_from !== null) {
                priceCondition[sequelize_1.Op.gte] = filters.price_from;
            }
            if (filters.price_to !== undefined && filters.price_to !== null) {
                priceCondition[sequelize_1.Op.lte] = filters.price_to;
            }
            whereConditions.push({ price: priceCondition });
        }
        let whereClause;
        if (whereConditions.length === 1) {
            whereClause = whereConditions[0];
        }
        else if (whereConditions.length > 1) {
            whereClause = { [sequelize_1.Op.and]: whereConditions };
        }
        const attributes = (0, query_builders_1.buildProductAttributes)(filters.fields);
        const includeDefs = (0, query_builders_1.buildInclude)(filters.include);
        const queryOptions = {
            order: [['id', 'DESC']],
            paranoid: filters.include_deleted === true ? false : true,
        };
        if (includeDefs && includeDefs.length > 0) {
            queryOptions.distinct = true;
        }
        if (attributes) {
            queryOptions.attributes = attributes;
        }
        if (includeDefs) {
            queryOptions.include = includeDefs;
        }
        if (!noPagination) {
            queryOptions.limit = pageSize;
            queryOptions.offset = offset;
        }
        if (whereClause) {
            queryOptions.where = whereClause;
        }
        const { rows: products, count: total } = await Product_1.default.findAndCountAll(queryOptions);
        const totalPages = noPagination ? 1 : Math.ceil(total / pageSize);
        const responseLimit = noPagination ? total : pageSize;
        return {
            data: products.map((product) => this.mapToProductResponse(product)),
            pagination: {
                page: noPagination ? 1 : pageNumber,
                limit: responseLimit,
                total,
                totalPages,
                hasNext: pageNumber < totalPages,
                hasPrev: pageNumber > 1,
            },
        };
    }
    async updateProduct(id, productData) {
        const product = await Product_1.default.findByPk(id);
        if (!product) {
            return null;
        }
        const updateData = {};
        if (productData.name !== undefined && productData.name !== null && productData.name.trim().length > 0) {
            updateData.name = productData.name.trim();
        }
        if (productData.price !== undefined && productData.price !== null && productData.price >= 0) {
            updateData.price = productData.price;
        }
        if (productData.description !== undefined) {
            updateData.description = productData.description || null;
        }
        if (productData.quantity !== undefined && productData.quantity !== null && productData.quantity >= 0) {
            updateData.quantity = productData.quantity;
        }
        if (Object.keys(updateData).length > 0) {
            await product.update(updateData, {
                fields: Object.keys(updateData),
            });
            await product.reload({
                attributes: ['id', 'name', 'price', 'description', 'quantity'],
            });
        }
        return this.mapToProductResponse(product);
    }
    async deleteProduct(id) {
        const deletedCount = await Product_1.default.destroy({
            where: { id },
            limit: 1,
        });
        return deletedCount > 0;
    }
    async hardDeleteProduct(id) {
        const deletedCount = await Product_1.default.destroy({
            where: { id },
            limit: 1,
            force: true,
        });
        return deletedCount > 0;
    }
    async restoreProduct(id) {
        const product = await Product_1.default.findByPk(id, {
            paranoid: false,
            attributes: ['id', 'deletedAt'],
        });
        if (!product) {
            console.log(`Restore failed: Product with id ${id} not found`);
            return false;
        }
        if (!product.deletedAt) {
            console.log(`Restore failed: Product with id ${id} is not deleted`);
            return false;
        }
        await product.restore();
        console.log(`Product ${id} restored successfully`);
        return true;
    }
    mapToProductResponse(product) {
        const plainProduct = product.get({ plain: true });
        return {
            ...plainProduct,
        };
    }
}
exports.ProductService = ProductService;
exports.default = new ProductService();
//# sourceMappingURL=productService.js.map