import { TreeItem } from "vscode";

export interface IActivityBarProvider {
    label: string;
    children?: TreeItem[];
}