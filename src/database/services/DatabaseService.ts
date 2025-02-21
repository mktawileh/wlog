import { Database } from 'better-sqlite3';

export interface Schema {
    [key: string]: string | number | boolean | null;
    id: number;
    deleted_at: number | null;
    created_at: number;
};

export interface GetAllOptions {
    table?: string;
    foreignKey?: string;
    primaryKey?: string;
}

export default class DatabaseService<T extends Schema> {
    private db: Database;
    private tableName: string;

    constructor(db: Database, tableName: string, schema: { [key: string]: string }) {
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

    insert(record: Omit<T, 'id'>): T {
        record = {
            ...record,
            created_at: Date.now(),
            deleted_at: null
        };
        const columns = Object.keys(record).join(', ');
        const placeholders = Object.keys(record).map(() => '?').join(', ');
        const values = Object.values(record);

        const stmt = this.db.prepare(`
            INSERT INTO ${this.tableName} (${columns})
            VALUES (${placeholders})
        `);
        const result = stmt.run(...values);
        return {
            ...record,
            id: result.lastInsertRowid as number,
        } as unknown as T;
    }

    getAll(options?: GetAllOptions): T[] {
        let query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`;

        if (options?.table && options.foreignKey && options.primaryKey) {
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
        return stmt.all() as T[];
    }

    private getTableColumns(tableName: string): string[] {
        const stmt = this.db.prepare(`
            PRAGMA table_info(${tableName});
        `);
        const columnsInfo = stmt.all();
        return columnsInfo.map(column => (column as any).name);
    }

    getById(id: number): T | undefined {
        const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`);
        const result = stmt.get(id);
        return result as T | undefined;
    }

    query(condition: string, params: any[] = []): T[] {
        const stmt = this.db.prepare(`
            SELECT * FROM ${this.tableName}
            WHERE ${condition}
        `);
        return stmt.all(...params) as T[];
    }

    sort(records: T[], field: keyof T, ascending: boolean = true): T[] {
        return records.sort((a, b) => {
            if (a[field] == null || b[field] == null) return -1;
            if (a[field] > b[field]) return ascending ? 1 : -1;
            if (a[field] < b[field]) return ascending ? -1 : 1;
            return 0;
        });
    }

    filter(records: T[], condition: (record: T) => boolean): T[] {
        return records.filter(condition);
    }

    update(id: number, updates: Partial<Omit<T, 'id'>>): void {
        const columns = Object.keys(updates).filter(column => updates[column]);
        if (columns.length === 0) return;

        const setClause = columns.map(column => `${column} = ?`).join(', ');
        const values = columns.map(column => updates[column]);

        const stmt = this.db.prepare(`
            UPDATE ${this.tableName}
            SET ${setClause}
            WHERE id = ?
        `);
        
        stmt.run(...values, id);
    }

    softDelete(id: number): void {
        this.update(id, {
            deleted_at: Date.now()
        } as unknown as Partial<Omit<T, 'id'>>);
    }

    close(): void {
        this.db.close();
    }
}
