import { Generic } from './generic';
import * as vscode from 'vscode';
import { PlatformTypeEnum } from './enum/generic';
import { IStringReplace } from './interface/generic';

export class Terminal {
    private terminal: vscode.Terminal | any;
    private shellCmd: string = '';

    constructor(
        private appName: string,
        private generic: Generic
    ) {
        vscode.window.onDidCloseTerminal(term => {
            this.terminal = undefined;
        });
        this.createTerminal();

        // Set Shell Command
        switch (this.generic.getPlatform()) {
            case PlatformTypeEnum.windows:
                this.shellCmd = 'powershell -command \"{0}\"';
                break;
            case PlatformTypeEnum.linux:
                this.shellCmd = 'bash -c \"{0}\"';
                break;
        }
    }

    private createTerminal() {
        if (!this.terminal) {
            this.terminal = vscode.window.createTerminal(this.appName);
        }
    }

    exec(command: string) {
        if (command && command.length > 0) {
            let replace: IStringReplace = {
                search: '{0}',
                toReplace: command
            };
            this.createTerminal();
            this.terminal.show(true);
            this.terminal.sendText(this.generic.stringReplaceAll(this.shellCmd, [replace]));
        }
    }

    getTerminal(): vscode.Terminal {
        this.createTerminal();
        return this.terminal;
    }
}