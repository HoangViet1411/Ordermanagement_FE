"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransaction = getTransaction;
exports.withExistingTransaction = withExistingTransaction;
const database_1 = require("./database");
function getTransaction() {
    return database_1.namespace.get('transaction');
}
async function withExistingTransaction(transaction, fn) {
    return database_1.namespace.runPromise(async () => {
        database_1.namespace.set('transaction', transaction);
        return fn(transaction);
    });
}
//# sourceMappingURL=transactionContext.js.map