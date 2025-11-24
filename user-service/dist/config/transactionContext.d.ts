import type { Transaction } from 'sequelize';
export declare function getTransaction(): Transaction | undefined;
export declare function withExistingTransaction<T>(transaction: Transaction, fn: (t: Transaction) => Promise<T>): Promise<T>;
//# sourceMappingURL=transactionContext.d.ts.map