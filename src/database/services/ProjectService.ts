import { Database } from "better-sqlite3";
import DatabaseService, { Schema } from "./DatabaseService";

export interface Project extends Schema {
    name: string;
}

export default class ProjectService extends DatabaseService<Project> {
    constructor(db: Database) {
        const schema = {
            name: 'TEXT NOT NULL',
        };
        super(db, 'projects', schema);
    }

    getByIdOrName(param: number | string): Project | undefined {
        const result = this.query(
            "id = ? OR name = ?",
            [param, param]
        );
        return result.shift();
    }

    getByName(name: string): Project | undefined {
        const result = this.query(
            "name = ?",
            [name]
        );
        return result.shift();
    }
}
