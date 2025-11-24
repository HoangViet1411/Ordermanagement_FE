import type { CreateProductDto, UpdateProductDto, ProductResponse, PaginatedResponse } from "../types";
export interface ProductFilterParams {
    search?: string;
    name?: string;
    description?: string;
    price_from?: number;
    price_to?: number;
    category_id?: number;
    include_deleted?: boolean;
    fields?: string;
    include?: string;
}
export declare class ProductService {
    createProduct(productData: CreateProductDto): Promise<ProductResponse>;
    getProductById(id: number): Promise<ProductResponse | null>;
    getAllProducts(page?: number, limit?: number, filters?: ProductFilterParams): Promise<PaginatedResponse<ProductResponse>>;
    updateProduct(id: number, productData: UpdateProductDto): Promise<ProductResponse | null>;
    deleteProduct(id: number): Promise<boolean>;
    hardDeleteProduct(id: number): Promise<boolean>;
    restoreProduct(id: number): Promise<boolean>;
    private mapToProductResponse;
}
declare const _default: ProductService;
export default _default;
//# sourceMappingURL=productService.d.ts.map