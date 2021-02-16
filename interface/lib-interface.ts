import { Command } from "vscode";

export interface IStringReplace {
    search: string;
    toReplace: string;
}
export interface IRegVsCmd {
    command: string;
    callback: (...args: any[]) => any;
    thisArg?: any;
}
export interface IResponse<T> {
    data: T,
    error: Error | undefined
}
export interface IProcessing {
    timeoutId: NodeJS.Timeout,
    disable: () => void
}
export interface IStatusBar {
    text: string,
    command: string | Command | undefined,
    tooltip?: string | undefined
}
export interface IBase64 {
    base: string,
    url: string
}
export interface ICallable {
    callback: (...args: any[]) => any;
    args?: any[],
    thisArg?: any
}
export interface IFileInfo {
    filename: string | undefined,
    basename: string,
    dirname: string,
    extension: string
}

export class IExtensionInfo {
    author: string = '';
    publisher: string = '';
    name: string = '';
    displayName: string = '';
    version: string = '';
    main: string = '';
    id: string = '';
    configData: any;
}