"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DatabaseService_1 = __importDefault(require("./DatabaseService"));
class ProjectService extends DatabaseService_1.default {
    constructor(db) {
        const schema = {
            name: 'TEXT NOT NULL',
        };
        super(db, 'projects', schema);
    }
    getByIdOrName(param) {
        const result = this.query("id = ? OR name = ?", [param, param]);
        return result.shift();
    }
    getByName(name) {
        const result = this.query("name = ?", [name]);
        return result.shift();
    }
}
exports.default = ProjectService;
