import { Model, type Optional } from 'sequelize';
export interface ProductAttributes {
    id: number;
    name: string;
    price: number;
    description: string | null;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'description' | 'quantity' | 'createdAt' | 'updatedAt'> {
}
declare class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
    id: number;
    name: string;
    price: number;
    description: string | null;
    quantity: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    deletedAt: Date | null;
}
export default Product;
//# sourceMappingURL=Product.d.ts.map