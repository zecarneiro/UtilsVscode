import { SqliteExtend } from './sqlite-extend';
import { SshExtend } from './ssh-extend';
import { ConsoleExtend } from './console-extend';
import { LibStatic } from './lib-static';
import { IRegVsCmd, IExtensionInfo, ITreeItemWithChildren, ITreeItemExtend } from './interface/lib-interface';
import { commands, ExtensionContext, extensions, workspace, TreeItem } from 'vscode';
import { JavaExtend } from './java-extend';

export class Lib {
    consoleExtend: ConsoleExtend;
    sshExtend: SshExtend;
    sqliteExtend: SqliteExtend;
    javaExtend: JavaExtend;

    constructor(
        public context: ExtensionContext,
        public extensionId: string,
        public objectName: string
    ) {
        this.consoleExtend = new ConsoleExtend(this.objectName);
        this.sshExtend = new SshExtend(this.consoleExtend);
        this.sqliteExtend = new SqliteExtend(this);
        this.javaExtend = new JavaExtend(this.consoleExtend);
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
    
    createActivityBar(data: ITreeItemWithChildren[] | ITreeItemExtend[], id: string) {
        let activityBarData: any[] = [];
        let vsCmd: IRegVsCmd[] = [];
        let treeItem = (dataTreeItem: ITreeItemExtend[] | undefined): TreeItem[] => {
            let treeItem: TreeItem[] = [];
            if (dataTreeItem) {
                dataTreeItem.forEach(val => {
                    treeItem.push(val.treeItem);
                    vsCmd.push({
                        callback: val.callback,
                        command: val.treeItem.command ? val.treeItem.command.command : '',
                    });
                });
            }
            return treeItem;
        };

        for (let i = 0; i < data.length; ++i) {
            if (data[i].hasChildren) {
                const dataWithChildren = data[i] as ITreeItemWithChildren;
                activityBarData.push({
                    label: dataWithChildren.label,
                    children: treeItem(dataWithChildren.children)
                });
            } else {
                const dataWithoutChildren = data[i] as ITreeItemExtend;
                activityBarData = activityBarData.concat(treeItem([dataWithoutChildren]));
            }
        }
        LibStatic.createActivityBar(activityBarData, id);
        this.registerVscodeCommand(vsCmd);
    }

    getStorage<T = any>(key: string, defaultValue?: T): T {
        let data = defaultValue
            ? this.context.globalState.get<T>(key, defaultValue) as T
            : this.context.globalState.get<T>(key) as T;
        return data ? LibStatic.copyJsonData(data) : data;
    }
    setStorage<T = any>(key: string, value: T | undefined) {
        this.context.globalState.update(key, value);
    }

    registerVscodeCommand(data: IRegVsCmd[]) {
        data.forEach(value => {
            if (value.callback) {
                let callback = () => {
                    if (value.callback) {
                        if (value.callback.isSync) {
                            LibStatic.runSync(value.callback.caller, value.callback.args, value.callback.thisArg);
                        } else {
                            LibStatic.run(value.callback.caller, value.callback.args, value.callback.thisArg);
                        }
                    }
                };
                let register = commands.registerCommand(value.command, callback);
                this.context.subscriptions.push(register);
            }
        });
    }

    getCommandFormated(name: string): string {
        return `${this.extensionData.name}.${name}`;
    }

    getExtensionPath(): string {
        return this.context.extensionPath;
    }
}
