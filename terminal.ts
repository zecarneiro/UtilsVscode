import { ShellType } from './enum/terminal';
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { Generic } from './generic';

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
    }

    private createTerminal() {
        if (!this.terminal) {
            this.terminal = vscode.window.createTerminal(this.appName);
        }
    }

    exec(command: string) {
        if (command && command.length > 0) {
            this.createTerminal();
            this.terminal.show(true);
            this.terminal.sendText(command);
        }
    }

    execOnOutputChanel(command: string, cwd: string | undefined, typeShell: ShellType) {
        command = typeShell.replace('{0}', command);
        this.generic.printOutputChannel("EXEC: " + command, false);

        let cmd = child_process.spawnSync(command, { cwd: cwd, encoding: 'utf8', shell: true });
        if (cmd.stdout) {
            this.generic.printOutputChannel(cmd.stdout, true, "STDOUT");
        }
        if (cmd.stderr) {
            this.generic.printOutputChannel(cmd.stderr, true, "STDERR");
        }
        if (cmd.status !== 0) {
            this.generic.printOutputChannel(cmd.status, true, "EXIT CODE");
        }
    }

    getTerminal(): vscode.Terminal {
        this.createTerminal();
        return this.terminal;
    }
}