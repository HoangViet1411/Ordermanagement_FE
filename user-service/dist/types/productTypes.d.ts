export interface CreateProductDto {
    name: string;
    price: number;
    description?: string;
    quantity?: number;
}
export interface UpdateProductDto {
    name?: string;
    price?: number;
    description?: string;
    quantity?: number;
}
export interface ProductResponse {
    id: number;
    name: string;
    price: number;
    description: string | null;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
//# sourceMappingURL=productTypes.d.ts.map