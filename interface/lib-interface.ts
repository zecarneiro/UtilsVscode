import { Command, TreeItem, TreeItemCollapsibleState } from "vscode";

export interface IStringReplace {
    search: string;
    toReplace: string;
}
export interface ICaller {
    caller: (...args: any[]) => any,
    isSync?: boolean,
    args?: any[],
    thisArg?: any
}
export interface IRegVsCmd {
    command: string;
    callback?: ICaller
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
export interface IFileInfo {
    filename: string | undefined,
    basename: string,
    dirname: string,
    extension: string
}
export interface ITreeItemExtend {
    treeItem: TreeItem,
    callback?: ICaller,
    hasChildren?: boolean;
}
export interface ITreeItemWithChildren {
    label: string;
    collapsibleState?: TreeItemCollapsibleState;
    children?: ITreeItemExtend[];
    hasChildren?: boolean;
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