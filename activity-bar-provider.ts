import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, window } from "vscode";
import { IActivityBarProvider } from "./interface/activity-bar-provider-interface";

export class ActivityBarProvider implements TreeDataProvider<any> {
    constructor(
        private outline: IActivityBarProvider[] | TreeItem[],
        private isAllCollapsed: boolean = true
    ) { }

    getTreeItem(item: any): TreeItem | Thenable<TreeItem> {
        if (item && item.children) {
            let state = this.isAllCollapsed
                ? TreeItemCollapsibleState.Collapsed
                : item.children && item.children.length > 0
                    ? TreeItemCollapsibleState.Expanded
                    : TreeItemCollapsibleState.Collapsed;
            return new TreeItem(item.label, state);
        }
        return item;
    }
    getChildren(element?: any): Thenable<IActivityBarProvider[] | TreeItem[]> {
        if (element) {
            return element.label ? Promise.resolve(element.children) : Promise.resolve(element);
        } else {
            return Promise.resolve(this.outline);
        }
    }
    create(viewId: string) {
        window.registerTreeDataProvider(viewId, new ActivityBarProvider(this.outline));
        window.createTreeView(viewId, {
            treeDataProvider: new ActivityBarProvider(this.outline)
        });
    }
}