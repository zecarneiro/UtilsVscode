import { QuickPickItem } from 'vscode';
import { ConsoleExtend } from "./console-extend";
import { ShellTypeEnum } from "./enum/console-extends-enum";
import { IFileInfo } from "./interface/lib-interface";
import { LibStatic } from "./lib-static";

export class JavaExtend {
    private readonly mvnCmd = 'mvn';
    private readonly pomFile = 'pom.xml';
    constructor(
        private consoleExtend: ConsoleExtend
    ) {
    }

    async findPomDir(directory: string, isInit: boolean): Promise<string> {
        let items: QuickPickItem[] = [];
        const separator = LibStatic.resolvePath<string>('/');
        const length = directory.split(separator).length;
        for (let i = 0; i < length; ++i) {
            const position = isInit ? i+1 : length - i;
            const cwd = directory.split(separator, position).join(separator);
            const pom = `${cwd}${separator}${this.pomFile}`;
            if (LibStatic.fileExist(pom, false)) {
                items.push({label: cwd, detail: pom});
            }
        }

        let item = await LibStatic.createQuickPick(items, { canPickMany: false, placeHolder: "Select Directory of pom file" });
        if (item) {
            item = item as QuickPickItem;
            return item.label;
        }
        return '';
    }

    runTest(fileTest: IFileInfo, pomDir: string | undefined, method?: string) {
        if (fileTest.basename && fileTest.basename.length > 0 && LibStatic.fileExist(fileTest.dirname, true)) {
            method = method ? `#${method}` : "";
            const className = fileTest.basename.split('.').slice(0, -1).join('.');
            const command = `${this.mvnCmd} -Dtest=${className}${method} test`;
            this.consoleExtend.execTerminal(command, pomDir, ShellTypeEnum.system);
        }
    }
}