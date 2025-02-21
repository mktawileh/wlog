"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
class DatabaseService {
    constructor(db, tableName, schema) {
        this.db = db;
        this.tableName = tableName;
        const columns = Object.entries(schema)
            .map(([key, type]) => `${key} ${type}`)
            .join(', ');
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at INTEGER NOT NULL,
                deleted_at INTEGER NULL,
                ${columns}
            );
        `);
    }
    insert(record) {
        record = Object.assign(Object.assign({}, record), { created_at: Date.now(), deleted_at: null });
        const columns = Object.keys(record).join(', ');
        const placeholders = Object.keys(record).map(() => '?').join(', ');
        const values = Object.values(record);
        const stmt = this.db.prepare(`
            INSERT INTO ${this.tableName} (${columns})
            VALUES (${placeholders})
        `);
        const result = stmt.run(...values);
        return Object.assign(Object.assign({}, record), { id: result.lastInsertRowid });
    }
    getAll(options) {
        let query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`;
        if ((options === null || options === void 0 ? void 0 : options.table) && options.foreignKey && options.primaryKey) {
            const prefix = options.foreignKey.split("_")[0];
            const joindColumns = this.getTableColumns(options.table)
                .map(column => `${options.table}.${column} AS ${prefix}_${column}`)
                .join(', ');
            query = `
                SELECT ${this.tableName}.*, ${joindColumns}
                FROM ${this.tableName}
                JOIN ${options.table} 
                ON ${this.tableName}.${options.foreignKey} = ${options.table}.${options.primaryKey}
                WHERE ${this.tableName}.deleted_at IS NULL
            `;
        }
        const stmt = this.db.prepare(query);
        return stmt.all();
    }
    getTableColumns(tableName) {
        const stmt = this.db.prepare(`
            PRAGMA table_info(${tableName});
        `);
        const columnsInfo = stmt.all();
        return columnsInfo.map(column => column.name);
    }
    getById(id) {
        const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`);
        const result = stmt.get(id);
        return result;
    }
    query(condition, params = []) {
        const stmt = this.db.prepare(`
            SELECT * FROM ${this.tableName}
            WHERE ${condition}
        `);
        return stmt.all(...params);
    }
    sort(records, field, ascending = true) {
        return records.sort((a, b) => {
            if (a[field] == null || b[field] == null)
                return -1;
            if (a[field] > b[field])
                return ascending ? 1 : -1;
            if (a[field] < b[field])
                return ascending ? -1 : 1;
            return 0;
        });
    }
    filter(records, condition) {
        return records.filter(condition);
    }
    update(id, updates) {
        const columns = Object.keys(updates).filter(column => updates[column]);
        if (columns.length === 0)
            return;
        const setClause = columns.map(column => `${column} = ?`).join(', ');
        const values = columns.map(column => updates[column]);
        const stmt = this.db.prepare(`
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = ?
        `);
        stmt.run(...values, id);
    }
    softDelete(id) {
        this.update(id, {
            deleted_at: Date.now()
        });
    }
    close() {
        this.db.close();
    }
}
exports.default = DatabaseService;
