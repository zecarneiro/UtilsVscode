import { Terminal } from './../terminal';
import * as vscode from 'vscode';
import { IActivityBarProvider } from './activity-bar-provider-interface';

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
export interface IPrintOutputChannel {
    isNewLine: boolean,
    hasSeparator?: boolean,
    title?: string,
    isClear?: boolean,
    encoding?: string
}
export interface IExtensionInfo {
    author: string,
    publisher: string,
    name: string,
    displayName: string,
    version: string,
    main: string,
    id: string,
    path: string,
    configData: any,
    terminal: Terminal
}
export interface IStatusBar {
    text: string,
    command: string | vscode.Command | undefined,
    tooltip?: string | undefined
}