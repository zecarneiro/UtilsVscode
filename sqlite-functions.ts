import { OutputFormatEnum } from './enum/sqlite-functions-enum';
import { IResponse } from './interface/generic-interface';
import * as child_process from 'child_process';
import { EOL } from 'os';
import { Generic } from './generic';
import { PlatformTypeEnum } from './enum/generic-enum';

export class SqliteFunctions {
    private binariesPath: string;
    private sqliteCommand: string = '';

    constructor(
        private generic: Generic
    ) {

        this.binariesPath = `${this.generic.extensionData.path}/utils/bin/sqlite3`;
        switch (this.generic.getPlatform()) {
            case PlatformTypeEnum.linux:
                this.sqliteCommand = `${this.binariesPath}/sqlite3-linux-x86`;
                break;
            case PlatformTypeEnum.windows:
                this.sqliteCommand = `${this.binariesPath}/sqlite3-win32-x86.exe`;
                break;
            default:
                break;
        }
        this.sqliteCommand = this.generic.resolvePath(this.sqliteCommand) as string;
    }

    private _file: string = '';
    set file(name: string) {
        if (name && name.length > 0 && name !== this._file) {
            this._file = this.generic.resolvePath(name) as string;
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
        status = this.generic.fileExist(this.sqliteCommand);
        message = !status ? "Invalid Sqlite3 command" : undefined;

        // Validate file
        if (status) {
            status = this.generic.fileExist(this._file);
            message = !status ? "Invalid database file" : undefined;
        }
        return {
            data: undefined,
            error: message ? Error(message) : undefined
        };
    }

    exec(query: string, callback: (result: IResponse<any>) => void) {
        let result: IResponse<any>;
        let errorMessage = '';
        let args = [
            `-nullvalue`, `NULL`, // print NULL for null values
            `-cmd`, `.mode tcl`
        ];

        result = this.validateData();
        if (!result.error) {
            let childProcess = child_process.spawn(this.sqliteCommand, args, { stdio: ['pipe', "pipe", "pipe"] });
            childProcess.stdin.write(`.open '${this._file}'${EOL}`);
            childProcess.stdin.write(`.mode ${this.generic.getEnumValueName(this._outputFormat, OutputFormatEnum)}${EOL}`);
            childProcess.stdin.end(query);

            childProcess.stdout.once('data', (data: any) => {
                result.data = data.toString().trim();
                if (result.data) {
                    switch (this.outputFormat) {
                        case OutputFormatEnum.json:
                            result.data = this.generic.stringToJson(result.data, false);
                            break;
                        default:
                            break;
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
                callback(result);
            });
        } else {
            callback(result);
        }
    }
}