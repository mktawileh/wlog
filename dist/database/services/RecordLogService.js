"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DatabaseService_1 = __importDefault(require("./DatabaseService"));
class LogRecordService extends DatabaseService_1.default {
    constructor(db) {
        const schema = {
            date: 'INTEGER NOT NULL',
            note: 'TEXT NOT NULL',
            hours: 'REAL NOT NULL',
            submitted_at: 'INTEGER NULL',
            project_id: 'INTEGER NOT NULL REFERENCES projects(id)',
        };
        super(db, 'logs', schema);
    }
    getLogsByDateRange(startDate, endDate) {
        return this.query('date >= ? AND date <= ?', [startDate, endDate]);
    }
    create(date, note, hours, projectId) {
        this.insert({
            date, note, hours,
            submitted_at: null,
            project_id: projectId
        });
    }
    submit(id) {
        this.update(id, {
            submitted_at: Date.now()
        });
    }
}
exports.default = LogRecordService;
