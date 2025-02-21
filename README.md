# wlog - Work Log CLI

**wlog** is a command-line tool for managing work logs and projects. It helps you track hours worked, associate logs with projects, and generate reports.

---

## Installation

To use **wlog**, ensure you have [Node.js](https://nodejs.org/) installed. Then, install the CLI globally using npm:

```bash
npm i -g mktawileh/wlog#main
```

Or you can install a specific version:

```bash
npm i -g mktawileh/wlog#0.0.1
```

---

## Usage

### General Syntax

```bash
wlog [--<option>[ <option-value>]] <command> [<command-args>]
```

### Commands

#### 1. **Project Management**

- **Add a Project**:
  ```bash
  wlog project <project-name>
  ```

- **Rename a Project**:
  ```bash
  wlog project --rename <new-name> <project-id>
  ```

- **Remove a Project**:
  ```bash
  wlog project --remove <project-id>
  ```

- **List All Projects**:
  ```bash
  wlog project --list
  ```

#### 2. **Work Log Management**

- **Add a Work Log**:
  ```bash
  wlog add -p <project-id|project-name> <hours> <log-note...>
  ```

  Example:
  ```bash
  wlog add -p 1 2 "Worked on the new feature"
  ```

- **Edit a Work Log**:
  ```bash
  wlog edit <log-id> [--hours <hours>] [--note <note>] [--date <date>] [--project <project-id|project-name>]
  ```

  Example:
  ```bash
  wlog edit 1 --hours 3 --note "Updated the feature"
  ```

- **Delete a Work Log**:
  ```bash
  wlog rm <log-id>
  ```

#### 3. **View Work Logs**

- **View All Logs in a Table**:
  ```bash
  wlog table
  ```

#### 4. **Submission**

- **Submit a Work Log**:
  ```bash
  wlog submit <log-id>
  ```

#### 5. **Help and Version**

- **Display Help**:
  ```bash
  wlog help [<subcommand>]
  ```

- **Check Version**:
  ```bash
  wlog version
  ```

---

## Options

- **`-v`**: Enable verbose mode.
- **`-nc`**: Disable colored output.

---

## Examples

1. **Add a Project**:
   ```bash
   wlog project "Website Redesign"
   ```

2. **Add a Work Log**:
   ```bash
   wlog add -p "Website Redesign" 4 "Designed the homepage layout"
   ```

3. **Edit a Work Log**:
   ```bash
   wlog edit 1 --hours 5 --note "Updated the homepage layout"
   ```

4. **View All Logs**:
   ```bash
   wlog table
   ```

5. **Delete a Project**:
   ```bash
   wlog project --remove 1
   ```

---

## Database

The application uses a SQLite database stored in the user's home directory under `~/.wlog/database.sqlite`. This ensures all logs and projects are persisted across sessions.

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/your-repo/wlog).

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Author

**Your Name**  
- GitHub: [mktawileh](https://github.com/mktawileh)  
- Email: mohamedtawileh@gmail.com

---

Enjoy tracking your work logs with **wlog**! 🚀
