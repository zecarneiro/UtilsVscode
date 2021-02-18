import { TreeItem, TreeItemCollapsibleState } from "vscode";

export interface IActivityBarProvider {
    label: string;
    children?: TreeItem[];
    collapsibleState?: TreeItemCollapsibleState;
}