import * as vscode from "vscode";

export interface IActivityBarProvider {
    label: string;
    children?: vscode.TreeItem[];
}