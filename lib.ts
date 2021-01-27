import { SqliteExtend } from './sqlite-extend';
import { SshExtend } from './ssh-extend';
import { ConsoleExtend } from './console-extend';
import { LibStatic } from './lib-static';
import { IRegVsCmd, IExtensionInfo } from './interface/lib-interface';
import { commands, ExtensionContext, extensions, workspace } from 'vscode';

export class Lib {
    consoleExtend: ConsoleExtend;
    sshExtend: SshExtend;
    sqliteExtend: SqliteExtend;

    constructor(
        private context: ExtensionContext,
        public extensionId: string
    ) {
        this.consoleExtend = new ConsoleExtend(this.extensionId);
        this.sshExtend = new SshExtend(this.consoleExtend);
        this.sqliteExtend = new SqliteExtend(this.context);
    }

    private _extensionData: IExtensionInfo | undefined;
    get extensionData(): IExtensionInfo {
        if (!this._extensionData) {
            let extension = extensions.getExtension(this.extensionId);
            let jsonData = extension && extension["packageJSON"] ? extension["packageJSON"] : undefined;
            if (jsonData) {
                this._extensionData = new IExtensionInfo();
                this._extensionData.author = jsonData['author']['name'] ? jsonData['author']['name'] : this._extensionData.author;
                this._extensionData.publisher = jsonData['publisher'] ? jsonData['publisher'] : this._extensionData.publisher;
                this._extensionData.name = jsonData['name'] ? jsonData['name'] : this._extensionData.name;
                this._extensionData.displayName = jsonData['displayName'] ? jsonData['displayName'] : this._extensionData.displayName;
                this._extensionData.version = jsonData['version'] ? jsonData['version'] : this._extensionData.version;
                this._extensionData.main = jsonData['main'] ? jsonData['main'] : this._extensionData.main;
                this._extensionData.id = jsonData['id'] ? jsonData['id'] : this._extensionData.id;
                this._extensionData.configData = workspace.getConfiguration(this._extensionData.name);
            } else {
                throw new Error("Invalid Extension ID");
            }
        }
        return LibStatic.copyJsonData(this._extensionData);
    }

    getStorage<T = any>(key: string, defaultValue?: T): T {
        let data = defaultValue
            ? this.context.globalState.get<T>(key, defaultValue) as T
            : this.context.globalState.get<T>(key) as T;
        return LibStatic.copyJsonData(data);
    }
    setStorage<T = any>(key: string, value: T | undefined) {
        this.context.globalState.update(key, value);
    }

    registerVscodeCommand(data: IRegVsCmd[]) {
        data.forEach(value => {
            let register = commands.registerCommand(value.command, value.callback, value.thisArg);
            this.context.subscriptions.push(register);
        });
    }
}
