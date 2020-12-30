import { Terminal } from './terminal';
import { IStringReplace, IRegVsCmd } from './interface/generic';
import { NotifyEnum, PlatformTypeEnum } from './enum/generic';
import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import * as moment from 'moment';
import { IActivityBarProvider } from './interface/activity-bar-provider';
import { ActivityBarProvider } from './activity-bar-provider';
import { existsSync } from 'fs';

export class Generic {
    constructor(
        private appName: string,
        private outputChannel: vscode.OutputChannel,
        private extensionContext: vscode.ExtensionContext
    ) { }

    getMessageSeparator(callerName?: string): string {
        let dateVal = this.formatDate(new Date);
        let message = (callerName && callerName.length > 0)
            ? `\n\n------ ${callerName}: ${dateVal} ------\n`
            : `\n\n------ ${dateVal} ------\n`;
        return message;
    }

    formatDate(dateVal: Date, format?: string): string {
        format = format ? format : 'DD-MMM-YYYY HH:mm:ss';
        return (moment(dateVal)).format(format);
    }

    getEnumValueName(value: any, typeEnum: any): string {
        if (value && typeEnum && typeEnum[value]) {
            return typeEnum[value] as string;
        }
        return "";
    }

    /**============================================
     *  NOTIFY
     *  PRINT_OUTPUT_CHANNEL
     *  SHOW_WEB_VIEW_HTML
     *  SHOW_FILES_MD
     *  SHOW_TEXT_DOCUMENT
     *=============================================**/
    notify(data: string, type?: NotifyEnum) {
        let message = `${this.appName}: ${data}`;
        switch (type) {
            case NotifyEnum.warning:
                vscode.window.showWarningMessage(message);
                break;
            case NotifyEnum.error:
                vscode.window.showErrorMessage(message);
                break;
            default:
                vscode.window.showInformationMessage(message);
                break;
        }
    }

    printOutputChannel(data: any, isSetSeparator: boolean = true, title?: string, isClear?: boolean) {
        if (isSetSeparator) {
            data = this.getMessageSeparator(title) + data;
        }
        if (isClear) {
            this.outputChannel.clear();
        }
        this.outputChannel.appendLine(data);
        this.outputChannel.show();
    }

    showWebViewHTML(body: string, title?: string) {
        let webViewPanel = vscode.window.createWebviewPanel(
            "WebView",
            title ? title : "Web View",
            vscode.ViewColumn.One,
            {}
        );
        let data: string = `
            <!DOCTYPE html>
            <html lang="pt">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
            </head>
            <body>
                ${body}
            </body>
            </html>
        `;
        webViewPanel.webview.html = data;
    }

    showFilesMD(file: string) {
        let fileUri = this.resolvePath(file, true) as vscode.Uri;
        vscode.commands.executeCommand("markdown.showPreview", fileUri);
    }

    showTextDocument(file: string) {
        let fileUri: vscode.Uri = this.resolvePath(file, true) as vscode.Uri;
        vscode.workspace.openTextDocument(fileUri).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  CREATE_INPUT_BOX
     *  CREATE_ACTIVITY_BAR
     *  CREATE_STATUS_BAR
     *  CREATE_QUICK_PICK
     *  CREATE_VSCODE_COMMAND
     *=============================================**/
    async createInputBox(inputBoxOptions: vscode.InputBoxOptions): Promise<string | undefined> {
        inputBoxOptions.ignoreFocusOut = false;
        let response = await vscode.window.showInputBox(inputBoxOptions);
        return response;
    }

    createActivityBar(data: IActivityBarProvider[] | vscode.TreeItem[], id: string) {
        let activityBar: ActivityBarProvider = new ActivityBarProvider(data);
        activityBar.create(id);
    }

    createStatusBar(text: any, command: any, tooltip?: any) {
        const statusbar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        statusbar.text = text;
        statusbar.command = command;
        statusbar.tooltip = tooltip;
        statusbar.show();
    }

    /*export function showQuickPick(items: string[] | Thenable<string[]>, options: QuickPickOptions & { canPickMany: true; }, token?: CancellationToken): Thenable<string[] | undefined>;
    export function showQuickPick(items: string[] | Thenable<string[]>, options?: QuickPickOptions, token?: CancellationToken): Thenable<string | undefined>;
    export function showQuickPick<T extends QuickPickItem>(items: T[] | Thenable<T[]>, options: QuickPickOptions & { canPickMany: true; }, token?: CancellationToken): Thenable<T[] | undefined>;
    export function showQuickPick<T extends QuickPickItem>(items: T[] | Thenable<T[]>, options?: QuickPickOptions, token?: CancellationToken): Thenable<T | undefined>;
    */

    createQuickPick(items: vscode.QuickPickItem[], options: vscode.QuickPickOptions): Thenable<vscode.QuickPickItem[] | vscode.QuickPickItem | undefined> {
        return vscode.window.showQuickPick<vscode.QuickPickItem>(items, options);
    }

    createVscodeCommand(data: IRegVsCmd[]) {
        data.forEach(value => {
            let register = vscode.commands.registerCommand(value.command, value.callback, value.thisArg);
            this.extensionContext.subscriptions.push(register);
        });
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  RESOLVE_PATH
     *  READ_DOCUMENT
     *  WRITE_DOCUMENT
     *  CREATE_TEMP_FILE
     *  FILE_EXIST
     *=============================================**/
    resolvePath(path: string, isGetUri?: boolean): string | vscode.Uri {
        return isGetUri ? vscode.Uri.file(path) : vscode.Uri.file(path).fsPath;
    }

    readDocument(file: string): string {
        file = this.resolvePath(file) as string;
        return fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });
    }

    writeDocument(file: string, data: any) {
        file = this.resolvePath(file) as string;
        fs.writeFileSync(file, data, { encoding: 'utf8', flag: 'w' });
    }

    createTempFile(fileName: string, data?: any): string {
        let tempdir = os.tmpdir();
        let temFile = this.resolvePath(`${tempdir}/${fileName}`) as string;
        this.writeDocument(temFile, data);
        return temFile;
    }

    fileExist(file: string): boolean {
        let exist: boolean = false;
        file = this.resolvePath(file) as string;
        if (existsSync(file)) {
            exist = true;
        }
        return exist;
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  STRING_TO_JSON
     *  STRING_REPLACE_ALL
     *=============================================**/
    stringToJson(data: any, isToString: boolean): any {
        if (!isToString) {
            return JSON.parse(data as string);
        } else {
            return JSON.stringify(data);
        }
    }

    stringReplaceAll(data: string, keysToReplace?: IStringReplace[]): string {
        keysToReplace?.forEach(value => {
            data = data.split(value.search).join(value.toReplace);
        });
        return data;
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  GET_STORAGE
     *  SET_STORAGE
     *=============================================**/
    getStorage<T = any>(key: string): T {
        return this.extensionContext.globalState.get<T>(key) as T;
    }

    setStorage<T = any>(key: string, value: T | undefined) {
        if (value) {
            let oldValue = this.getStorage<T>(key);
            if (oldValue !== value) {
                this.extensionContext.globalState.update(key, value);
            }
        }
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  GET_BASE_64_FILE
     *  GET_BASE_64_URL
     *=============================================**/
    getBase64File(file: string): string {
        file = this.resolvePath(file) as string;
        let buff = fs.readFileSync(file).toString('base64');
        return buff;
    }

    getBase64URL(content64: string, type: string): string {
        return `data:${type};base64,${content64}`;
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  GET_PLATFORM
     *  REMOVE_DUPLICATES_VALUES
     *  INSTALL_UNINSTALL_EXTENSIONS
     *=============================================**/
    getPlatform(): PlatformTypeEnum | undefined {
        switch (process.platform) {
            case 'linux':
                return PlatformTypeEnum.linux;
            case 'win32':
                return PlatformTypeEnum.windows;
            default:
                return undefined;
        }
    }

    removeDuplicatesValues(array: Array<any>): Array<any> {
        if (array instanceof Array) {
            let newArray: any[] = [];
            array.forEach(value => {
                let exist = false;
                for (const key in newArray) {
                    if (JSON.stringify(newArray[key]) === JSON.stringify(value)) {
                        exist = true;
                        break;
                    }
                }
                if (!exist) {
                    newArray.push(value);
                }
            });
            return newArray;
        }
        return array;
    }

    installUninstallExtensions(extensionsId: string, terminal: Terminal, isUninstall?: boolean) {
        let commandExt = (isUninstall) ? 'code --uninstall-extension {0}' : 'code --install-extension {0}';
        const stringsReplace: IStringReplace[] = [{ search: '{0}', toReplace: extensionsId }];
        const cmd = this.stringReplaceAll(commandExt, stringsReplace);
        terminal.exec(cmd);
    }
    /*=============== END OF SECTION ==============*/
}