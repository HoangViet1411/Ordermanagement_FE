"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transactional = Transactional;
const database_1 = require("../config/database");
const sequelize_1 = require("sequelize");
function Transactional(options) {
    return function (_target, _propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        if (typeof originalMethod !== 'function') {
            return descriptor;
        }
        descriptor.value = async function (...args) {
            const self = this;
            const methodArgs = args;
            const transactionOptions = options || {
                isolationLevel: sequelize_1.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            };
            return await database_1.sequelize.transaction(transactionOptions, async (_t) => {
                return await originalMethod.apply(self, methodArgs);
            });
        };
        return descriptor;
    };
}
//# sourceMappingURL=Transactional.js.map