import * as vscode from "vscode";
import { IActivityBarProvider } from "./interface/activity-bar-provider-interface";

export class ActivityBarProvider implements vscode.TreeDataProvider<any> {
    constructor(
        private outline: IActivityBarProvider[] | vscode.TreeItem[],
        private isAllCollapsed: boolean = true
    ) { }

    getTreeItem(item: any): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (item && item.children) {
            let state = this.isAllCollapsed
                ? vscode.TreeItemCollapsibleState.Collapsed
                : item.children && item.children.length > 0
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.Collapsed;
            return new vscode.TreeItem(item.label, state);
        }
        return item;
    }

    getChildren(element?: any): Thenable<IActivityBarProvider[] | vscode.TreeItem[]> {
        if (element) {
            return element.label ? Promise.resolve(element.children) : Promise.resolve(element);
        } else {
            return Promise.resolve(this.outline);
        }
    }

    create(viewId: string) {
        vscode.window.registerTreeDataProvider(viewId, new ActivityBarProvider(this.outline));
        vscode.window.createTreeView(viewId, {
            treeDataProvider: new ActivityBarProvider(this.outline)
        });
    }
}