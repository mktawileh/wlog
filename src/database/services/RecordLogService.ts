import { Database } from "better-sqlite3";
import DatabaseService from "./DatabaseService";
import { LogRecord } from "../models/LogRecord";

export default class LogRecordService extends DatabaseService<LogRecord> {
    constructor(db: Database) {
        const schema = {
            date: 'INTEGER NOT NULL',
            note: 'TEXT NOT NULL',
            hours: 'REAL NOT NULL',
            submitted_at: 'INTEGER NULL',
            project_id: 'INTEGER NOT NULL REFERENCES projects(id)',
        };
        super(db, 'logs', schema);
    }

    getLogsByDateRange(startDate: number, endDate: number): LogRecord[] {
        return this.query('date >= ? AND date <= ?', [startDate, endDate]);
    }

    create(date: number, note: string, hours: number, projectId: number): void {
        this.insert({
            date, note, hours,
            submitted_at: null,
            project_id: projectId
        });
    }

    submit(id: number): void {
        this.update(id, {
            submitted_at: Date.now()
        });
    }
}
