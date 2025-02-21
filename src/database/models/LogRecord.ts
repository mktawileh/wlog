import { Schema } from "../services/DatabaseService";

export interface LogRecord extends Schema {
    date: number;
    note: string;
    hours: number;
    project_id: number;
    project_name: string;
};
