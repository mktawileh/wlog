#!/usr/bin/env node
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const CliBase_1 = __importDefault(require("./core/CliBase"));
const Opt_1 = __importDefault(require("./decorators/Opt"));
const Subcommand_1 = __importDefault(require("./decorators/Subcommand"));
const SubOpt_1 = __importDefault(require("./decorators/SubOpt"));
const DateUtils_1 = __importDefault(require("./utils/DateUtils"));
const package_json_1 = __importDefault(require("../package.json"));
const ProjectService_1 = __importDefault(require("./database/services/ProjectService"));
const RecordLogService_1 = __importDefault(require("./database/services/RecordLogService"));
const StringTable_1 = __importDefault(require("./utils/StringTable"));
class WlogCli extends CliBase_1.default {
    get appDir() { return path_1.default.join(os_1.default.homedir(), `.${this.name}`); }
    constructor() {
        super("wlog", "[--<option>[ <option-value>]] <command> [<command-args>]");
        this.verbose = "0";
        this.noColors = "0";
        if (!fs_1.default.existsSync(this.appDir)) {
            fs_1.default.mkdirSync(this.appDir, { recursive: true });
            this.log("Info", "Generated app directory at", this.appDir);
        }
        this.database = new better_sqlite3_1.default(path_1.default.join(this.appDir, "database.sqlite"));
        this.logService = new RecordLogService_1.default(this.database);
        this.projectService = new ProjectService_1.default(this.database);
    }
    onRunFinish() {
        this.database.close();
    }
    project(args) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const answer = yield this.askQuestion(`Do you really want to remove project with '(${id}) ${project.name}' (y/n)? `, {
                    validate: a => "yn".includes(a.toLowerCase())
                });
                if (answer.toLowerCase() === "y") {
                    this.projectService.softDelete(id);
                    this.log("success", `Deleted project '(${id}) ${project.name}' successfully`);
                }
            }
            else if (rename.value !== undefined) {
                const idArg = args.shift();
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
            }
            else if (list.value !== "0") {
                const data = this.projectService.getAll();
                const columns = [
                    { key: "id", name: "ID", width: 1 },
                    { key: "name", name: "Name", width: 3 },
                ];
                this.log("info", `Count: ${data.length}`);
                this.print((0, StringTable_1.default)(data, columns, {
                    noColors: this.options.noColors.value === "1",
                    maxWidth: 50
                }));
            }
            else {
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
        });
    }
    add(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let date;
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
                date = new Date().getTime();
            }
            else {
                const dateTimeOption = DateUtils_1.default.parse((_a = dateOption.value) !== null && _a !== void 0 ? _a : "");
                if (dateTimeOption === null) {
                    this.log("error", "Invalid date format, It should be one of this formats: 'd' or 'd/m' or 'd/m/y'");
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
        });
    }
    edit(args) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { date: dateOption, note: noteOption, hours: hoursOption, project: projectOption } = this.subcommand.options;
            const id = Number(args.shift());
            if (isNaN(id)) {
                this.log("error", "Id must be a valid number");
                return 1;
            }
            let log = this.logService.getById(id);
            if (log === undefined) {
                this.log("error", "No record found with id " + id);
                return 1;
            }
            const updated = {};
            if (projectOption.value !== undefined) {
                const project = this.projectService.getByIdOrName(projectOption.value);
                if (project === undefined) {
                    this.log("error", `No project found with id or name equal to '${projectOption.value}'`);
                    return 1;
                }
                updated.project_id = project.id;
            }
            let hours;
            if (hoursOption.value !== undefined)
                hours = Number(hoursOption.value);
            if (hours !== undefined && isNaN(hours)) {
                this.log("error", "Hours must be a valid number");
                return 1;
            }
            let date;
            if (dateOption.value !== undefined) {
                const dateTimeOption = DateUtils_1.default.parse((_a = dateOption.value) !== null && _a !== void 0 ? _a : "");
                if (dateTimeOption === null) {
                    this.log("error", "Invalid date format, It should be one of this formats: 'd' or 'd/m' or 'd/m/y'");
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
        });
    }
    rm(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number(args.shift());
            if (isNaN(id)) {
                this.log("error", "Id must be a valid number");
                return 1;
            }
            let log = this.logService.getById(id);
            if (log === undefined) {
                this.log("error", "No record found with id " + id);
                return 1;
            }
            const answer = yield this.askQuestion(`Do you really want to remove record with id '${id}' (y/n)? `, {
                validate: a => "yn".includes(a.toLowerCase())
            });
            if (answer.toLowerCase() === "y") {
                this.logService.softDelete(id);
                this.log("success", `Deleted record '${id}' successfully`);
            }
            return 0;
        });
    }
    submit(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = Number(args.shift());
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
        });
    }
    table(args) {
        return __awaiter(this, void 0, void 0, function* () {
            args; // Ignore for now.
            const data = this.logService.getAll({
                table: "projects",
                foreignKey: "project_id",
                primaryKey: "id",
            }).map(r => (Object.assign(Object.assign({}, r), { date: DateUtils_1.default.toString(r.date, "dm"), submitted_at: r.submitted_at ? "Yes" : "No", project: r.project_name })));
            const columns = [
                { key: "id", name: "ID", width: 1 },
                { key: "date", name: "Date", width: 2 },
                { key: "hours", name: "Hours", width: 2 },
                { key: "project", name: "Project", width: 4 },
                { key: "note", name: "Notes", width: 15 },
                { key: "submitted_at", name: "S.", width: 1 },
            ];
            this.log("info", `Count: ${data.length}`);
            this.print((0, StringTable_1.default)(data, columns, {
                noColors: this.options.noColors.value === "1"
            }));
            return 0;
        });
    }
    help(args) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    version(_) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log(`wlog version ${package_json_1.default.version}`);
            return 0;
        });
    }
}
__decorate([
    (0, Subcommand_1.default)("", "Manage the list of projects"),
    (0, SubOpt_1.default)("remove", "-r,--remove"),
    (0, SubOpt_1.default)("rename", "-m,--rename"),
    (0, SubOpt_1.default)("list", "-l,--list", "0", true),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "project", null);
__decorate([
    (0, Subcommand_1.default)("[(-d|--date) <date>] -p <project-id|project-name> <hours> <log-note...> ", "Add a log to the base"),
    (0, SubOpt_1.default)("date", "-d,--date"),
    (0, SubOpt_1.default)("project", "-p,--project"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "add", null);
__decorate([
    (0, Subcommand_1.default)("id [(-h|--hours) <hours>] [(-n|--notes) <notes>] [(-d|--date) <dates>]", "Modify an existing record"),
    (0, SubOpt_1.default)("hours", "-h,--hours"),
    (0, SubOpt_1.default)("note", "-n,--note"),
    (0, SubOpt_1.default)("date", "-d,--date"),
    (0, SubOpt_1.default)("project", "-p,--project"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "edit", null);
__decorate([
    (0, Subcommand_1.default)("id", "Delete a record log"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "rm", null);
__decorate([
    (0, Subcommand_1.default)("id", "Submit a work log record"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "submit", null);
__decorate([
    (0, Subcommand_1.default)("", "Get the work logs as table"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "table", null);
__decorate([
    (0, Subcommand_1.default)("[<subcommand>]", "The help command"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "help", null);
__decorate([
    (0, Subcommand_1.default)("", "Get the version of wlog cli"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], WlogCli.prototype, "version", null);
__decorate([
    (0, Opt_1.default)("-v", true),
    __metadata("design:type", String)
], WlogCli.prototype, "verbose", void 0);
__decorate([
    (0, Opt_1.default)("-nc", true),
    __metadata("design:type", Object)
], WlogCli.prototype, "noColors", void 0);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const args = process.argv.slice(2);
        const wlog = new WlogCli();
        const code = yield wlog.run(args);
        process.exit(code);
    });
}
main();
