import { LibStatic } from './lib-static';
import { NotifyEnum, PlatformTypeEnum } from './enum/lib-enum';
import { OutputFormatEnum } from './enum/sqlite-extend-enum';
import { IResponse } from './interface/lib-interface';
import { spawn } from 'child_process';
import * as os from 'os';
import { Lib } from './lib';

export class SqliteExtend {
    private binariesPath: string;
    private sqliteCommand: string = '';
    private readonly timeToSleep = 5000; // 5 sec
    private readonly tryLength = 3; // try 3 times

    constructor(
        private lib: Lib
    ) {
        this.binariesPath = `${this.lib.getExtensionPath()}/utils/bin/sqlite3`;
        switch (LibStatic.getPlatform()) {
            case PlatformTypeEnum.linux:
                this.sqliteCommand = `${this.binariesPath}/sqlite3-linux-x86`;
                break;
            case PlatformTypeEnum.windows:
                this.sqliteCommand = `${this.binariesPath}/sqlite3-win32-x86.exe`;
                break;
            default:
                break;
        }
        this.sqliteCommand = LibStatic.resolvePath<string>(this.sqliteCommand);
    }

    private _file: string = '';
    set file(name: string) {
        if (name && name.length > 0 && name !== this._file) {
            this._file = LibStatic.resolvePath<string>(name);
        }
    }
    get file(): string {
        return this._file;
    }

    private _outputFormat: OutputFormatEnum = OutputFormatEnum.json;
    set outputFormat(format: OutputFormatEnum) {
        this._outputFormat = format;
    }
    get outputFormat(): OutputFormatEnum {
        return this._outputFormat;
    }

    private validateData(): IResponse<any> {
        let status = false;
        let message: string | undefined;

        // Validate sqlite command
        status = LibStatic.fileExist(this.sqliteCommand, false);
        message = !status ? "Invalid Sqlite3 command" : undefined;

        // Validate file
        if (status) {
            status = LibStatic.fileExist(this._file, false);
            message = !status ? "Invalid database file" : undefined;
        }
        return {
            data: undefined,
            error: message ? Error(message) : undefined
        };
    }

    exec<T>(query: string, callback: (result: IResponse<T>, isClosed?: boolean) => void) {
        let result: IResponse<T>;
        let errorMessage = '';
        let args = [
            `-nullvalue`, `NULL`, // print NULL for null values
            `-cmd`, `.mode ${this._outputFormat}`
        ];

        result = this.validateData();
        if (!result.error) {
            let childProcess = spawn(this.sqliteCommand, args, { stdio: ['pipe', "pipe", "pipe"] });
            childProcess.stdin.write(`.open '${this._file}'${os.EOL}`);
            childProcess.stdin.write(`.mode ${this._outputFormat}${os.EOL}`);
            childProcess.stdin.end(query);

            childProcess.stdout.once('data', (data: any) => {
                data = data.toString().trim();
                if (this._outputFormat === OutputFormatEnum.json) {
                    if (LibStatic.isJsonParsable(data)) {
                        result.data = LibStatic.stringToJson(data, false);
                    } else {
                        LibStatic.notify("Expected JSON Format from database", NotifyEnum.error);
                    }
                }
            });

            childProcess.stderr.on('data', (data) => {
                errorMessage += data.toString().trim();
            });

            childProcess.once('error', (data) => {
                errorMessage += data;
            });

            childProcess.once('close', () => {
                result.error = errorMessage ? Error(errorMessage) : undefined;
                callback(result, true);
            });
            childProcess.once('exit', (code) => {
                callback(result, true);
            });
        } else {
            callback(result, true);
        }
    }
}