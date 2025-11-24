"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
require("./models");
const database_triggers_1 = require("./utils/database-triggers");
const PORT = Number.parseInt(process.env['PORT'] ?? '3000', 10);
async function startServer() {
    try {
        await database_1.sequelize.authenticate();
        console.log(' Database connection established successfully.');
        const shouldSync = process.env['SYNC_DB'] === 'true';
        if (shouldSync) {
            await database_1.sequelize.sync({ force: false, alter: true });
            console.log(' Database synced successfully. All tables are ready.');
            console.log(' 💡 Tip: Set SYNC_DB=false in .env to skip sync on next run');
        }
        else {
            console.log(' Skipping database sync (set SYNC_DB=false in .env to disable)');
        }
        const shouldApplyTriggers = process.env['APPLY_TRIGGERS'] === 'true';
        if (shouldApplyTriggers) {
            const triggersExist = await (0, database_triggers_1.checkTriggersExist)();
            if (!triggersExist) {
                console.log(' Applying order triggers...');
                await (0, database_triggers_1.applyOrderTriggers)();
            }
            else {
                console.log(' Order triggers already exist. Skipping...');
            }
        }
        else {
            console.log(' Skipping trigger application (set APPLY_TRIGGERS=true in .env to enable)');
        }
        app_1.default.listen(PORT, () => {
            console.log(` Server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error(' Unable to start server:', error);
        process.exit(1);
    }
}
startServer();
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await database_1.sequelize.close();
    process.exit(0);
});
//# sourceMappingURL=index.js.map