import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, "../../todos.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
    create table if not exists tasks (
        id integer primary key autoincrement,
        title text not null,
        completed integer not null default 0,
        created_at datetime default current_timestamp 
    );
`);

export default db;
