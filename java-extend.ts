import { IJavaExtend } from './interface/java-extend-inteface';
import { QuickPickItem } from 'vscode';
import { ConsoleExtend } from "./console-extend";
import { ShellTypeEnum } from "./enum/console-extends-enum";
import { LibStatic } from "./lib-static";

export class JavaExtend {
    private readonly mvnCmd = 'mvn';
    private readonly pomFile = 'pom.xml';
    constructor(
        private consoleExtend: ConsoleExtend
    ) {
    }

    async findPomDir(directory: string, isInit?: boolean): Promise<string> {
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

    async runTest(data: IJavaExtend, shellType: ShellTypeEnum) {
        let command = this.mvnCmd;

        if (data.isFailIfNoTests !== true) {
            command += ` -DfailIfNoTests=false`;
        }

        if (data.isClean) {
            command += ` clean`;
        }

        // Insert class and method
        if (data.file.basename && data.file.basename.length > 0 && LibStatic.fileExist(data.file.dirname, true)) {
            const method = data.method ? `#${data.method}` : "";
            const className = data.file.basename.split('.').slice(0, -1).join('.');
            command += ` -Dtest=${className}${method}`;
            if (!data.pomDir) {
                data.pomDir = await this.findPomDir(data.file.dirname);
            }
        }

        // Insert others arguments
        if (data.otherArgs && data.otherArgs.length > 0) {
            data.otherArgs.forEach(arg => {
                command += ` ${arg}`;
            });
        }

        // Run
        if (data.runCmdBeforeTest && data.runCmdBeforeTest.length > 0) {
            data.runCmdBeforeTest.forEach(command => {
                this.consoleExtend.execTerminal(command.cmd, command.cwd, shellType);
            });
        }
        this.consoleExtend.execTerminal(`${command} test`, data.pomDir, shellType);
    }
}