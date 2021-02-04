import { ConsoleExtend } from './console-extend';
import {
    commands,
    ExtensionContext,
    InputBoxOptions,
    OpenDialogOptions,
    OutputChannel,
    QuickPickItem,
    QuickPickOptions,
    StatusBarAlignment,
    TreeItem,
    Uri,
    ViewColumn,
    window,
    workspace,
    WorkspaceFolder
} from "vscode";
import { NotifyEnum, PlatformTypeEnum } from "./enum/lib-enum";
import { IBase64, IProcessing, IStatusBar, IStringReplace } from "./interface/lib-interface";
import * as fse from 'fs-extra';
import * as os from 'os';
import * as moment from 'moment';
import { ActivityBarProvider } from "./activity-bar-provider";
import { IActivityBarProvider } from "./interface/activity-bar-provider-interface";

export class LibStatic {
    /**============================================
     *!  SHOW MULTIPLE FILES
     * 
     *  SHOW_WEB_VIEW_HTML
     *  SHOW_FILES_MD
     *  SHOW_TEXT_DOCUMENT
     *  CREATE_INPUT_BOX
     *=============================================**/
    static showWebViewHTML(body: string, title?: string) {
        let webViewPanel = window.createWebviewPanel(
            "WebView",
            title ? title : "Web View",
            ViewColumn.One,
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
    static showFilesMD(file: string) {
        let fileUri = this.resolvePath(file, true) as Uri;
        commands.executeCommand("markdown.showPreview", fileUri);
    }
    static showTextDocument(file: string) {
        let fileUri: Uri = this.resolvePath(file, true) as Uri;
        workspace.openTextDocument(fileUri).then(doc => {
            window.showTextDocument(doc);
        });
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *! FORMS
     * 
     *  CREATE_INPUT_BOX
     *=============================================**/
    static async createInputBox(inputBoxOptions: InputBoxOptions): Promise<string | undefined> {
        inputBoxOptions.ignoreFocusOut = false;
        let response = await window.showInputBox(inputBoxOptions);
        return response;
    }
    static createActivityBar(data: IActivityBarProvider[] | TreeItem[], id: string, isAllCollapsed?: boolean) {
        let activityBar: ActivityBarProvider = new ActivityBarProvider(data, isAllCollapsed);
        activityBar.create(id);
    }
    static createStatusBar(options: IStatusBar) {
        const statusbar = window.createStatusBarItem(StatusBarAlignment.Right, 0);
        statusbar.text = options.text;
        statusbar.command = options.command;
        statusbar.tooltip = options.tooltip;
        statusbar.show();
    }
    static async createQuickPick(items: QuickPickItem[], options: QuickPickOptions): Promise<QuickPickItem[] | QuickPickItem | undefined> {
        let seleted = await window.showQuickPick<QuickPickItem>(items, options);
        return seleted;
    }
    static async showOpenDialog(options: OpenDialogOptions): Promise<Uri[] | undefined> {
        return await window.showOpenDialog(options);
    }
    /*=============== END OF SECTION ==============*/

    /**============================================ 
     *  NOTIFY
     *  INSTALL_UNINSTALL_EXTENSIONS
     *  SHOW_PROCESSING
     *=============================================**/
    static notify(data: any, type?: NotifyEnum) {
        switch (type) {
            case NotifyEnum.warning:
                window.showWarningMessage(data);
                break;
            case NotifyEnum.error:
                window.showErrorMessage(data);
                break;
            default:
                window.showInformationMessage(data);
                break;
        }
    }
    static showProcessing(message: string, outputChannel: OutputChannel, timeToPrint?: number): IProcessing {
        outputChannel.show();
        outputChannel.append(message);
        let id: NodeJS.Timeout = setInterval(() => {
            outputChannel.append('.');
        }, timeToPrint ? timeToPrint : 5000);
        return {
            timeoutId: id,
            disable: () => { clearTimeout(id); }
        };
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *!  FILES AND DIRECTORIES
     * 
     *  RESOLVE_PATH
     *  READ_DOCUMENT
     *  WRITE_DOCUMENT
     *  CREATE_TEMP_FILE
     *  FILE_EXIST
     *  GET_WORKSPACE_DIR
     *  GET_BASE_64_FILE
     *  GET_EXTENSION_PATH
     *=============================================**/
    static resolvePath<T extends string | Uri>(path: string, isGetUri?: boolean): T {
        let data = isGetUri ? Uri.file(path) : Uri.file(path).fsPath;
        return data as T;
    }
    static readDocument(file: string): string {
        let data = fse.readFileSync(file, { encoding: 'utf8', flag: 'r' });
        return data.toString();
    }
    static writeDocument(file: string, data: any) {
        fse.writeFileSync(file, data, { encoding: 'utf8', flag: 'w' });
    }
    static createTempFile(fileName: string, data?: any) {
        let tempdir = os.tmpdir();
        let temFile = LibStatic.resolvePath(`${tempdir}/${fileName}`) as string;
        LibStatic.writeDocument(temFile, data);
        return temFile;
    }
    static fileExist(file: string, isDir: boolean): boolean {
        if (fse.existsSync(file)) {
            return (isDir) ? fse.statSync(file).isDirectory() : fse.statSync(file).isFile();
        }
        return false;
    }
    static getWorkspaceDir(name?: string): WorkspaceFolder | WorkspaceFolder[] | undefined {
        if (workspace.workspaceFolders) {
            let folders = LibStatic.copyJsonData(workspace.workspaceFolders) as WorkspaceFolder[];
            if (name) {
                return folders.find(x => x.name === name);
            }
            return folders;
        }
        return undefined;
    }
    static getBase64File(file: string, type?: string): IBase64 {
        file = LibStatic.resolvePath(file) as string;
        let base = fse.readFileSync(file)?.toString('base64');
        return {
            base: base,
            url: `data:${type};base64,${base}`
        };
    }
    static getExtensionPath(context: ExtensionContext): string {
        return context.extensionPath;
    }
    static getVscodeStorageStateFile(): string {
        let homeDir: string = os.homedir();
        let stateStorageFile: string = 'Code/User/globalStorage/state.vscdb';
        switch (LibStatic.getPlatform()) {
            case PlatformTypeEnum.linux:
                stateStorageFile = homeDir + '/.config/' + stateStorageFile;
                break;
            case PlatformTypeEnum.windows:
                stateStorageFile = homeDir + '\\AppData\\Roaming\\' + stateStorageFile;
                break;
            default:
                stateStorageFile = '';
                break;
        }
        return LibStatic.resolvePath(stateStorageFile);
    }
    /*=============== END OF SECTION FILES AND DIRECTORIES ==============*/

    /**============================================
     *! OTHERS
     * 
     *  CREATE_GENERIC_TYPE
     *  COPY_JSON_DATA
     *  REMOVE_DUPLICATES_VALUES
     *  GET_PLATFORM
     *  STRING_TO_JSON
     *  STRING_REPLACE_ALL
     *  GET_MESSAGE_SEPARATOR
     *  FORMAT_DATE
     *  GET_ENUM_VALUE_NAME
     *  INSTALL_UNINSTALL_EXTENSIONS
     *  RUN_VSCODE_COMMAND
     *=============================================**/
    static createGenericType<T>(tCreator: new (...args: []) => T): T {
        return new tCreator();
    }
    static copyJsonData(data: any): any {
        return JSON.parse(JSON.stringify(data));
    }
    static jsonConcat(object: any, object1: any): any {
        for (var key in object1) {
            object[key] = object1[key];
        }
        return LibStatic.copyJsonData(object);
    }
       
    static removeDuplicatesValues(array: Array<any>): Array<any> {
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
    static getPlatform(): PlatformTypeEnum | undefined {
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
    static readEnvVariable(variable: string): string | undefined {
        return process.env[variable] ? process.env[variable] : undefined;
    }
    static stringToJson(data: any, isToString: boolean): any {
        if (!isToString) {
            return JSON.parse(data as string);
        } else {
            return JSON.stringify(data);
        }
    }
    static stringReplaceAll(data: string, keysToReplace?: IStringReplace[]): string {
        keysToReplace?.forEach(value => {
            data = data.split(value.search).join(value.toReplace);
        });
        return data;
    }
    static getMessageSeparator(callerName?: string): string {
        let dateVal = LibStatic.formatDate(new Date);
        let message = (callerName && callerName.length > 0)
            ? `\n------ ${callerName}: ${dateVal} ------\n`
            : `\n------ ${dateVal} ------\n`;
        return message;
    }
    static formatDate(dateVal: Date, format?: string): string {
        format = format ? format : 'DD-MMM-YYYY HH:mm:ss';
        return (moment(dateVal)).format(format);
    }
    static getEnumValueName(value: any, typeEnum: any): string {
        if (value && typeEnum && typeEnum[value]) {
            return typeEnum[value] as string;
        }
        return "";
    }
    static installUninstallExtensions(extensionsId: string[], console: ConsoleExtend, isUninstall?: boolean) {
        let commandExt = (isUninstall) ? 'code --uninstall-extension {0}' : 'code --install-extension {0}';
        extensionsId.forEach(id => {
            const stringsReplace: IStringReplace[] = [{ search: '{0}', toReplace: id }];
            const cmd = LibStatic.stringReplaceAll(commandExt, stringsReplace);
            console.execTerminal(cmd);
        });
    }
    static async runVscodeCommand<T>(command: string, ...rest: any[]): Promise<T | undefined> {
        return await commands.executeCommand<T>(command, rest) as T;
    }
    static isAsyncFunction(caller: any): boolean {
        const asyncFunction = (async () => {}).constructor;
        return caller instanceof asyncFunction;
    }
    /*=============== END OF SECTION ==============*/
}