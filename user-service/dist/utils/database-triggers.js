"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyOrderTriggers = applyOrderTriggers;
exports.checkTriggersExist = checkTriggersExist;
const fs_1 = require("fs");
const path_1 = require("path");
const database_1 = require("../config/database");
async function applyOrderTriggers() {
    try {
        const sqlFilePath = (0, path_1.join)(process.cwd(), 'database', 'triggers', 'order_triggers.sql');
        try {
            (0, fs_1.readFileSync)(sqlFilePath, 'utf-8');
        }
        catch (fileError) {
            console.error(` SQL file not found: ${sqlFilePath}`);
            throw new Error(`SQL trigger file not found: ${sqlFilePath}`);
        }
        const sql = (0, fs_1.readFileSync)(sqlFilePath, 'utf-8');
        const lines = sql.split('\n');
        const statements = [];
        let currentStatement = '';
        let inTriggerBlock = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]?.trim() ?? '';
            if (line.startsWith('--') || line === '') {
                continue;
            }
            if (line.includes('DELIMITER $$')) {
                inTriggerBlock = true;
                continue;
            }
            if (line.includes('DELIMITER ;')) {
                inTriggerBlock = false;
                if (currentStatement) {
                    const cleanedStatement = currentStatement.trim().replace(/END\$\$/g, 'END;');
                    statements.push(cleanedStatement);
                    currentStatement = '';
                }
                continue;
            }
            if (inTriggerBlock) {
                currentStatement += line + ' ';
                if (line.includes('END$$')) {
                    const cleanedStatement = currentStatement.trim().replace(/END\$\$/g, 'END;');
                    statements.push(cleanedStatement);
                    currentStatement = '';
                }
            }
            else {
                if (line.includes('DROP TRIGGER')) {
                    statements.push(line);
                }
            }
        }
        if (currentStatement) {
            const cleanedStatement = currentStatement.trim().replace(/END\$\$/g, 'END;');
            statements.push(cleanedStatement);
        }
        for (const statement of statements) {
            if (statement && (statement.includes('DROP TRIGGER') || statement.includes('CREATE TRIGGER'))) {
                try {
                    await database_1.sequelize.query(statement);
                    console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
                }
                catch (queryError) {
                    console.error(`❌ Error executing statement: ${statement.substring(0, 50)}...`);
                    console.error('Full error:', queryError);
                    throw queryError;
                }
            }
        }
        console.log('✅ Order triggers applied successfully');
    }
    catch (error) {
        console.error('❌ Error applying order triggers:', error);
        throw error;
    }
}
async function checkTriggersExist() {
    try {
        const [results] = await database_1.sequelize.query(`
      SELECT COUNT(*) as count
      FROM information_schema.TRIGGERS
      WHERE TRIGGER_SCHEMA = DATABASE()
      AND TRIGGER_NAME IN (
        'calculate_line_total_on_insert',
        'calculate_line_total_on_update',
        'update_order_total_on_insert',
        'update_order_total_on_update',
        'update_order_total_on_delete'
      )
    `);
        return results[0]?.count >= 5;
    }
    catch (error) {
        console.error('Error checking triggers:', error);
        return false;
    }
}
//# sourceMappingURL=database-triggers.js.map