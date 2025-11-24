"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.namespace = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const cls = __importStar(require("cls-hooked"));
require("dotenv/config");
const namespace = cls.createNamespace('sequelize-transaction-namespace');
exports.namespace = namespace;
sequelize_1.Sequelize.useCLS(namespace);
const DB_NAME = process.env['DB_NAME'] ?? 'todo_list';
const DB_USER = process.env['DB_USER'] ?? 'root';
const DB_PASS = process.env['DB_PASS'] ?? '';
const DB_HOST = process.env['DB_HOST'] ?? 'localhost';
const DB_PORT = Number.parseInt(process.env['DB_PORT'] ?? '3306', 10);
const DB_LOG_SQL = process.env['DB_LOG_SQL'] === 'true';
console.log('[Database Config] DB_LOG_SQL:', DB_LOG_SQL);
console.log('[Database Config] CLS enabled for automatic transaction passing');
exports.sequelize = new sequelize_1.Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    logging: DB_LOG_SQL
        ? (sql) => {
            console.log('\n                   SQL QUERY EXECUTION                     ');
            console.log('══════════════════════════════════════════════════════════════');
            console.log('', sql);
            console.log('══════════════════════════════════════════════════════════════\n');
        }
        : false,
    define: {
        timestamps: false,
        underscored: true,
    },
});
//# sourceMappingURL=database.js.map