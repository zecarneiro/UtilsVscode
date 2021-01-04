import { Terminal } from './terminal';
import { IStringReplace, IRegVsCmd, IProcessing, IPrintOutputChannel, IExtensionInfo, IStatusBar } from './interface/generic-interface';
import { NotifyEnum, PlatformTypeEnum } from './enum/generic-enum';
import * as vscode from 'vscode';
import * as os from 'os';
import * as fse from 'fs-extra';
import * as moment from 'moment';
import { IActivityBarProvider } from './interface/activity-bar-provider-interface';
import { ActivityBarProvider } from './activity-bar-provider';

export class Generic {
    constructor(
        private extensionId: string,
        private extensionContext: vscode.ExtensionContext
    ) { }

    private _extensionData: IExtensionInfo | undefined;
    get extensionData(): IExtensionInfo {
        if (!this._extensionData) {
            let extension = vscode.extensions.getExtension(this.extensionId);
            let jsonData = extension && extension["packageJSON"] ? extension["packageJSON"] : undefined;
            this._extensionData = {} as IExtensionInfo;

            if (jsonData) {
                this._extensionData = {
                    author: jsonData['author']['name'],
                    publisher: jsonData['publisher'],
                    name: jsonData['name'],
                    displayName: jsonData['displayName'],
                    version: jsonData['version'],
                    main: jsonData['main'],
                    id: jsonData['id'],
                    path: this.extensionContext.extensionPath,
                    configData: vscode.workspace.getConfiguration(jsonData['name']),
                    outputChannel: vscode.window.createOutputChannel(jsonData['displayName']),
                    terminal: new Terminal(jsonData['displayName'], this)
                };
            }
        }
        return this._extensionData;
    }

    /**============================================
     *  GET_MESSAGE_SEPARATOR
     *  FORMAT_DATE
     *  GET_ENUM_VALUE_NAME
     *=============================================**/

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
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  NOTIFY
     *  PRINT_OUTPUT_CHANNEL
     *  SHOW_WEB_VIEW_HTML
     *  SHOW_FILES_MD
     *  SHOW_TEXT_DOCUMENT
     *=============================================**/
    notify(data: any, type?: NotifyEnum) {
        let message = `${this.extensionData.displayName}: ${data}`;
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

    printOutputChannel(data: any, options?: IPrintOutputChannel) {
        let config: IPrintOutputChannel = options ? options : {
            isNewLine: true,
        };
        if (!config.encoding) {
            config.encoding = 'utf8';
        }

        if (config.hasSeparator) {
            data = this.getMessageSeparator(config.title) + data;
            config.isNewLine = false;
        }
        if (config.isClear) {
            this.extensionData.outputChannel.clear();
        }

        data = data.toString(config.encoding);
        if (config.isNewLine) {
            this.extensionData.outputChannel.appendLine(data);
        } else {
            this.extensionData.outputChannel.append(data);
        }
        this.extensionData.outputChannel.show();
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
     *  RUN_VSCODE_COMMAND
     *  SHOW_OPEN_DIALOG
     *=============================================**/
    async createInputBox(inputBoxOptions: vscode.InputBoxOptions): Promise<string | undefined> {
        inputBoxOptions.ignoreFocusOut = false;
        let response = await vscode.window.showInputBox(inputBoxOptions);
        return response;
    }

    createActivityBar(data: IActivityBarProvider[] | vscode.TreeItem[], id: string, isAllCollapsed?: boolean) {
        let activityBar: ActivityBarProvider = new ActivityBarProvider(data, isAllCollapsed);
        activityBar.create(id);
    }

    createStatusBar(options: IStatusBar) {
        const statusbar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        statusbar.text = options.text;
        statusbar.command = options.command;
        statusbar.tooltip = options.tooltip;
        statusbar.show();
    }

    async createQuickPick(items: vscode.QuickPickItem[], options: vscode.QuickPickOptions): Promise<vscode.QuickPickItem[] | vscode.QuickPickItem | undefined> {
        let seleted = await vscode.window.showQuickPick<vscode.QuickPickItem>(items, options);
        return seleted;
    }

    createVscodeCommand(data: IRegVsCmd[]) {
        data.forEach(value => {
            let register = vscode.commands.registerCommand(value.command, value.callback, value.thisArg);
            this.extensionContext.subscriptions.push(register);
        });
    }

    // TODO: NOT TESTED
    async runVscodeCommand<T>(command: string, ...rest: any[]): Promise<T | undefined> {
        return await vscode.commands.executeCommand<T>(command, rest);
    }

    async showOpenDialog(options: vscode.OpenDialogOptions): Promise<vscode.Uri[] | undefined> {
        return await vscode.window.showOpenDialog(options);
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
        let data = fse.readFileSync(file, { encoding: 'utf8', flag: 'r' });
        return data.toString();
    }

    writeDocument(file: string, data: any) {
        file = this.resolvePath(file) as string;
        fse.writeFileSync(file, data, { encoding: 'utf8', flag: 'w' });
    }

    createTempFile(fileName: string, data?: any) {
        let tempdir = os.tmpdir();
        let temFile = this.resolvePath(`${tempdir}/${fileName}`) as string;
        this.writeDocument(temFile, data);
        return temFile;
    }

    fileExist(file: string): boolean {
        return fse.existsSync(file);
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
        let buff = fse.readFileSync(file);
        return buff.toString('base64');
    }

    getBase64URL(content64: string, type: string): string {
        return `data:${type};base64,${content64}`;
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *  GET_PLATFORM
     *  REMOVE_DUPLICATES_VALUES
     *  INSTALL_UNINSTALL_EXTENSIONS
     *  SHOW_PROCESSING
     *=============================================**/
    getPlatform(): PlatformTypeEnum | undefined {
        switch (process.platform) {
            case 'linux':
                return PlatformTypeEnum.linux;
            case 'win32':
                return PlatformTypeEnum.windows;
            case 'darwin':
                return PlatformTypeEnum.osx;
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

    installUninstallExtensions(extensionsId: string, isUninstall?: boolean) {
        let commandExt = (isUninstall) ? 'code --uninstall-extension {0}' : 'code --install-extension {0}';
        let extension = vscode.extensions.getExtension(extensionsId);
        const stringsReplace: IStringReplace[] = [{ search: '{0}', toReplace: extensionsId }];
        if ((isUninstall && extension) || (!isUninstall && !extension)) {
            const cmd = this.stringReplaceAll(commandExt, stringsReplace);
            this.extensionData.terminal.exec(cmd);
        }
    }

    showProcessing(message: string, timeToPrint?: number): IProcessing {
        this.printOutputChannel(message, { isNewLine: true });
        let id: NodeJS.Timeout = setInterval(() => {
            this.printOutputChannel('.', { isNewLine: false });
        }, timeToPrint ? timeToPrint : 5000);
        return {
            timeoutId: id,
            disable: () => { clearTimeout(id); }
        };
    }
    /*=============== END OF SECTION ==============*/
}