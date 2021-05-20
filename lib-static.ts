import { ConsoleExtend } from './console-extend';
import {
    commands,
    extensions,
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
import { IBase64, IFileInfo, IProcessing, IStatusBar, IStringReplace } from "./interface/lib-interface";
import * as fse from 'fs-extra';
import * as os from 'os';
import * as moment from 'moment';
import * as path from 'path';
import { IActivityBarProvider } from './interface/activity-bar-provider-interface';
import { ActivityBarProvider } from './activity-bar-provider';

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
        let fileUri = LibStatic.resolvePath<Uri>(file, true);
        commands.executeCommand("markdown.showPreview", fileUri);
    }
    static showTextDocument(file: string) {
        let fileUri: Uri = LibStatic.resolvePath<Uri>(file, true);
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
    static createActivityBar(data: IActivityBarProvider[] | TreeItem[], id: string) {
        let activityBar: ActivityBarProvider = new ActivityBarProvider(data);
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
    static resolvePath<T extends string | Uri>(strPath: string, isGetUri?: boolean): T {
        let data = isGetUri ? Uri.file(strPath) : Uri.file(strPath).fsPath;
        return data as T;
    }
    static writeJsonFile(file: string, data: any, spaces?: string | number) {
        spaces = spaces ? spaces : 4;
        fse.writeJsonSync(file, data, { encoding: 'utf8', flag: 'w', spaces: spaces });
    }
    static readDocument(file: string): string {
        let data = fse.readFileSync(file, { encoding: 'utf8', flag: 'r' });
        return data.toString();
    }
    static writeDocument(file: string, data: any,) {
        fse.writeFileSync(file, data, { encoding: 'utf8', flag: 'w' });
    }
    static createTempFile(fileName: string, data?: any) {
        let tempdir = os.tmpdir();
        let temFile = LibStatic.resolvePath<string>(`${tempdir}/${fileName}`);
        LibStatic.writeDocument(temFile, data);
        return temFile;
    }
    static fileExist(file: string, isDir: boolean): boolean {
        if (fse.existsSync(file)) {
            return (isDir) ? fse.statSync(file).isDirectory() : fse.statSync(file).isFile();
        }
        return false;
    }
    static createDir(dir: string) {
        if (!this.fileExist(dir, true)) {
            fse.mkdirSync(dir, {recursive: true});
        }
    }
    static copyDir(src: string, dest: string, overwrite: boolean, onlyCopyFilesInside?: boolean) {
        if (LibStatic.fileExist(src, true)) {
            fse.copySync(src, dest, {recursive: true, overwrite: overwrite});
        }
    }
    static getActiveFileNameDocument(file?: string): IFileInfo {
        let response: IFileInfo = {
            filename: file,
            basename: '',
            dirname: '',
            extension: ''
        };

        file = file && file.length > 0 ? file : window.activeTextEditor?.document.fileName;
        if (file && file.length > 0) {
            response.filename = file;
            response.basename = path.basename(file);
            response.dirname = path.dirname(file);
            response.extension = path.extname(file);
        }
        return response;
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
        file = LibStatic.resolvePath<string>(file);
        let base = fse.readFileSync(file)?.toString('base64');
        return {
            base: base,
            url: `data:${type};base64,${base}`
        };
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
    static stringToJson(data: any, isToString: boolean, space?: string | number | undefined): any {
        if (!isToString) {
            return JSON.parse(data as string);
        } else {
            space = space ? space : 4;
            return JSON.stringify(data, null, space);
        }
    }
    static stringReplaceAll(data: string, keysToReplace?: IStringReplace[]): string {
        keysToReplace?.forEach(value => {
            data = data.split(value.search).join(value.toReplace);
        });
        return data;
    }
    static getMessageSeparator(callerName?: string): string {
        let dateVal = LibStatic.formatDate();
        let message = (callerName && callerName.length > 0)
            ? `\n------ ${callerName}: ${dateVal} ------\n`
            : `\n------ ${dateVal} ------\n`;
        return message;
    }
    static formatDate(dateVal?: Date, format?: string): string {
        dateVal = dateVal ? dateVal : new Date;
        format = format ? format : 'DD-MMM-YYYY HH:mm:ss';
        return (moment(dateVal)).format(format);
    }
    static getEnumValueName(value: any, typeEnum: any): string {
        if (value && typeEnum && typeEnum[value]) {
            return typeEnum[value] as string;
        }
        return "";
    }
    static isExtensionInstalled(id: string): boolean {
        return extensions.getExtension(id) ? true : false;
    }
    static installUninstallExtensions(extensionsId: string[], console: ConsoleExtend, isUninstall?: boolean) {
        let commandExt = (isUninstall) ? 'code --uninstall-extension {0}' : 'code --install-extension {0}';

        LibStatic.notify("Install/Uninstall extensions...", NotifyEnum.default);
        extensionsId.forEach(id => {
            const isInstall = LibStatic.isExtensionInstalled(id);
            if ((!isUninstall && !isInstall) || (isUninstall && isInstall)) {
                const stringsReplace: IStringReplace[] = [{ search: '{0}', toReplace: id }];
                const cmd = LibStatic.stringReplaceAll(commandExt, stringsReplace);
                console.execTerminal(cmd);
            }
        });
    }
    static async runVscodeCommand<T>(command: string, ...rest: any[]): Promise<T | undefined> {
        return await commands.executeCommand<T>(command, rest) as T;
    }
    static isAsyncFunction(caller: any): boolean {
        const asyncFunction = (async () => {}).constructor;
        return caller instanceof asyncFunction;
    }

    /**
     * Run Method on try catch
     * @param caller
     */
    static async run<T>(caller: (...args: any[]) => any, args?: any[], thisArg?: any): Promise<T> {
        let result: T;
        try {
            args = args ? args : [];
            result = await caller.apply<any, any[], any>(thisArg, args);
        } catch (error) {
            throw new Error(error);
        }
        return result;
    }

    /**
     * Run Method on try catch sync
     * @param caller
     */
    static runSync<T>(caller: (...args: any[]) => any, args?: any[], thisArg?: any): T {
        let result: T;
        try {
            args = args ? args : [];
            result = caller.apply<any, any[], any>(thisArg, args);
        } catch (error) {
            throw new Error(error);
        }
        return result;
    }

    static sleep(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    static isJsonParsable(jsonStr: string): boolean {
        try {
            JSON.parse(jsonStr);
        } catch (e) {
            return false;
        }
        return true;
    }
    /*=============== END OF SECTION ==============*/
}