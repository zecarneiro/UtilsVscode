import { IResponse } from './interface/generic';
import * as sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { Generic } from './generic';

export class SqliteFunctions {
    private db: Database<sqlite3.Database, sqlite3.Statement> | undefined;

    constructor() { }

    private _file: string = '';
    set file(name: string) {
        if (name && name.length > 0 && name !== this._file) {
            this.endConnection();
            this._file = name;
        }
    }
    get file(): string {
        return this._file;
    }

    async open(): Promise<IResponse<Database<sqlite3.Database, sqlite3.Statement>>> {
        let response: IResponse<Database<sqlite3.Database, sqlite3.Statement>> = {
            status: false,
            message: '',
            data: {} as Database<sqlite3.Database, sqlite3.Statement>
        };

        if (this._file.length > 0) {
            if (!this.db) {
                await open({
                    filename: this._file,
                    driver: sqlite3.Database
                }).then(value => {
                    this.db = value;
                    response.status = true;
                    response.data = this.db;
                }).catch(reason => {
                    response.status = false;
                    response.message = reason;
                });
            } else {
                response.data = this.db;
            }
        } else {
            response.message = "Invalid DB File";
        }
        return response;
    }

    endConnection() {
        if (this.db) {
            this.db.close();
            this.db = undefined;
        }
    }
}