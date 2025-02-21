#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import Database from "better-sqlite3";

import CliBase from "./core/CliBase";
import Opt from "./decorators/Opt";
import Subcommand from "./decorators/Subcommand";
import SubOpt from "./decorators/SubOpt";
import DateUtils from "./utils/DateUtils";
import packagejson from "../package.json";
import ProjectService from "./database/services/ProjectService";
import LogRecordService from "./database/services/RecordLogService";
import stringTable from "./utils/StringTable";
import { LogRecord } from "./database/models/LogRecord";

class WlogCli extends CliBase {
    private database: Database.Database;
    private logService: LogRecordService;
    private projectService: ProjectService;
    private get appDir(): string { return path.join(os.homedir(), `.${this.name}`) }

    constructor() {
        super("wlog", "[--<option>[ <option-value>]] <command> [<command-args>]");
        if (!fs.existsSync(this.appDir)) {
            fs.mkdirSync(this.appDir, { recursive: true });
            this.log("Info", "Generated app directory at", this.appDir);
        }
        this.database = new Database(path.join(this.appDir, "database.sqlite"));
        this.logService = new LogRecordService(this.database);
        this.projectService = new ProjectService(this.database);
    }

    onRunFinish() {
        this.database.close();
    }

    @Subcommand("", "Manage the list of projects")
    @SubOpt("remove", "-r,--remove")
    @SubOpt("rename", "-m,--rename")
    @SubOpt("list", "-l,--list", "0", true)
    async project(args: string[]): Promise<number>{
        const { remove } = this.subcommand.options;
        const { list } = this.subcommand.options;
        const { rename } = this.subcommand.options;

        if (remove.value !== undefined) {
            const id = Number(remove.value);
            if (isNaN(id)) {
                this.log("error", `Id must be a valid number, received '${remove.value}'`);
                return 1;
            }

            const project = this.projectService.getById(id);

            if (project === undefined) {
                this.log("error", "No project found with id " + id);
                return 1;
            }

            const answer = await this.askQuestion(
                `Do you really want to remove project with '(${id}) ${project.name}' (y/n)? `,
                {
                    validate: a => "yn".includes(a.toLowerCase())
                }
            );

            if (answer.toLowerCase() === "y") {
                this.projectService.softDelete(id);
                this.log("success", `Deleted project '(${id}) ${project.name}' successfully`);
            }
        } else if (rename.value !== undefined) {
            const idArg = args.shift()
            const id = Number(idArg);
            if (isNaN(id)) {
                this.log("error", `Id must be a valid number, received '${idArg}'`);
                return 1;
            }

            const name = rename.value;
            const project = this.projectService.getById(id);

            if (project === undefined) {
                this.log("error", "No project found with id " + id);
                return 1;
            }

            if (name === project.name) {
                this.log("info", "Nothing to update");
                return 0;
            }

            this.projectService.update(id, { name });
            this.log("success", `Updated project successfully, '${project.name}' -> '${name}'`);
        } else if (list.value !== "0") {
            const data = this.projectService.getAll();

            const columns = [
                { key: "id", name: "ID", width: 1 },
                { key: "name", name: "Name", width: 3 },
            ];

            this.log("info", `Count: ${data.length}`);

            this.print(
                stringTable(data, columns, {
                    noColors: this.options.noColors.value === "1",
                    maxWidth: 50
                })
            );
        } else {
            const name = args.shift();

            if (name === undefined) {
                this.log("error", "No name was provided");
                this.usage(this.subcommand.name);
                return 1;
            }

            if (this.projectService.getByName(name) !== undefined) {
                this.log("error", `Project '${name}' already exists.`);
                return 1;
            }

            this.projectService.insert({ name });

            this.log("success", "Add 1 project successfully");
        }

        return 0;
    }

    @Subcommand("[(-d|--date) <date>] -p <project-id|project-name> <hours> <log-note...> ", "Add a log to the base")
    @SubOpt("date", "-d,--date")
    @SubOpt("project", "-p,--project")
    async add(args: string[]): Promise<number> {
        let date: number;
        const { date: dateOption, project: projectOption } = this.subcommand.options;

        if (projectOption.value === undefined) {
            this.log("error", "No project was provided");
            this.usage(this.subcommand.name);
            return 1;
        }

        const project = this.projectService.getByIdOrName(projectOption.value);
        if (project === undefined) {
            this.log("error", `No project found with id or name equal to '${projectOption.value}'`);
            return 1;
        }

        if (dateOption.value === undefined) {
            date = new Date().getTime()
        } else {            
            const dateTimeOption = DateUtils.parse(dateOption.value ?? "");
            if (dateTimeOption === null) {
                this.log(
                    "error",
                    "Invalid date format, It should be one of this formats: 'd' or 'd/m' or 'd/m/y'"
                );
                return 1;
            }
            date = dateTimeOption;
        }

        let hoursArg = args.shift();
        if (hoursArg === undefined) {
            this.log("error", "No hours was provided");
            this.usage(this.subcommand.name);
            return 1;
        }

        const hours = Number(hoursArg);
        if (isNaN(hours)) {
            this.log("error", `Invalid value for hours '${hoursArg}', expected a number`);
            this.usage(this.subcommand.name);
            return 1;
        }

        const note = args.join(" ").trim();
        if (note === "") {
            this.log("error", "No note was provided");
            this.usage(this.subcommand.name);
            return 1;
        }

        this.logService.create(date, note, hours, project.id);
        this.log("success", "Added 1 record");

        return 0;
    }

    @Subcommand("id [(-h|--hours) <hours>] [(-n|--notes) <notes>] [(-d|--date) <dates>]", "Modify an existing record")
    @SubOpt("hours", "-h,--hours")
    @SubOpt("note", "-n,--note")
    @SubOpt("date", "-d,--date")
    @SubOpt("project", "-p,--project")
    async edit(args: string[]): Promise<number> {
        const { date: dateOption, note: noteOption, hours: hoursOption, project: projectOption } = this.subcommand.options;

        const id: number = Number(args.shift());
        if (isNaN(id)) {
            this.log("error", "Id must be a valid number");
            return 1;
        }

        let log = this.logService.getById(id);
        if (log === undefined) {
            this.log("error", "No record found with id " + id);
            return 1;
        }

        const updated: Partial<LogRecord> = {}

        if (projectOption.value !== undefined) {            
            const project = this.projectService.getByIdOrName(projectOption.value);
            if (project === undefined) {
                this.log("error", `No project found with id or name equal to '${projectOption.value}'`);
                return 1;
            }
            updated.project_id = project.id;
        }
        
        let hours: number | undefined;
        if (hoursOption.value !== undefined)
            hours = Number(hoursOption.value)
        if (hours !== undefined && isNaN(hours)) {
            this.log("error", "Hours must be a valid number");
            return 1;
        }

        let date: number | undefined;
        if (dateOption.value !== undefined) {
            const dateTimeOption = DateUtils.parse(dateOption.value ?? "");
            if (dateTimeOption === null) {
                this.log(
                    "error",
                    "Invalid date format, It should be one of this formats: 'd' or 'd/m' or 'd/m/y'"
                );
                return 1;
            }
            date = dateTimeOption;
        }

        updated.hours = hours;
        updated.date = date;
        updated.note = noteOption.value;

        this.logService.update(id, updated);
        log = this.logService.getById(id);
        this.log("success", "Updated successfully");

        return 0;
    }

    @Subcommand("id", "Delete a record log")
    async rm(args: string[]): Promise<number> {
        const id: number = Number(args.shift());
        if (isNaN(id)) {
            this.log("error", "Id must be a valid number");
            return 1;
        }

        let log = this.logService.getById(id);
        if (log === undefined) {
            this.log("error", "No record found with id " + id);
            return 1;
        }

        const answer = await this.askQuestion(
            `Do you really want to remove record with id '${id}' (y/n)? `,
            {
                validate: a => "yn".includes(a.toLowerCase())
            }
        );

        if (answer.toLowerCase() === "y") {
            this.logService.softDelete(id);
            this.log("success", `Deleted record '${id}' successfully`);
        }

        return 0;
    }

    @Subcommand("id", "Submit a work log record")
    async submit(args: string[]): Promise<number> {
        const id: number = Number(args.shift());
        if (isNaN(id)) {
            this.log("error", "Id must be a valid number");
            return 1;
        }

        let log = this.logService.getById(id);
        if (log === undefined) {
            this.log("error", "No record found with id " + id);
            return 1;
        }

        this.logService.submit(id);
        // TODO: Submit to the report page
        this.log("success", `Submitted ${id} successfully`);
        return 0;
    }

    @Subcommand("", "Get the work logs as table")
    async table(args: string[]): Promise<number> {
        args; // Ignore for now.
        const data = this.logService.getAll({
            table: "projects",
            foreignKey: "project_id",
            primaryKey: "id",
        }).map(r => ({
            ...r,
            date: DateUtils.toString(r.date, "dm"),
            submitted_at: r.submitted_at ? "Yes" : "No",
            project: r.project_name
        }));

        const columns = [
            { key: "id", name: "ID", width: 1 },
            { key: "date", name: "Date", width: 2 },
            { key: "hours", name: "Hours", width: 2 },
            { key: "project", name: "Project", width: 4 },
            { key: "note", name: "Notes", width: 15 },
            { key: "submitted_at", name: "S.", width: 1 },
        ];

        this.log("info", `Count: ${data.length}`);

        this.print(stringTable(data, columns,
            {
                noColors: this.options.noColors.value === "1"
            }
        ));

        return 0;
    }

    @Subcommand("[<subcommand>]", "The help command")
    async help(args: string[]): Promise<number> {
        const subcmd = args.shift();

        if (subcmd === undefined) {
            this.usage();
            return 0;
        }

        if (!this.subcommands.hasOwnProperty(subcmd)) {
            this.log("error", `Unkown subcommand '${subcmd}'`);
            return 1;
        }

        this.usage(subcmd);
        return 0;
    }

    @Subcommand("", "Get the version of wlog cli")
    async version(_: string[]): Promise<number> {
        this.log(`wlog version ${packagejson.version}`);
        return 0;
    }

    @Opt("-v", true)
    verbose: string = "0";

    @Opt("-nc", true)
    noColors = "0";
}

async function main() {
    const args = process.argv.slice(2);
    const wlog = new WlogCli();
    const code = await wlog.run(args);
    process.exit(code);
}

main();
