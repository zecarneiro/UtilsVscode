import { ShellType } from './enum/terminal-enum';
import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { Generic } from './generic';
import { PlatformTypeEnum } from './enum/generic-enum';

export class Terminal {
    private terminal: vscode.Terminal;
    private isClosed: boolean = false;

    constructor(
        private appName: string,
        private generic: Generic
    ) {
        this.terminal = vscode.window.createTerminal(this.appName);
        vscode.window.onDidCloseTerminal(term => {
            this.isClosed = true;
        });
    }

    private createTerminal() {
        if (this.isClosed) {
            this.terminal = vscode.window.createTerminal(this.appName);
            this.isClosed = false;
        }
    }

    private getCommandByShell(command: string): string {
        switch (this.generic.getPlatform()) {
            case PlatformTypeEnum.linux:
                command = ShellType.bash.replace('{0}', command);
                break;
            case PlatformTypeEnum.windows:
                command = ShellType.powershell.replace('{0}', command);
                break;
        }
        return command;
    }

    exec(command: string) {
        if (command && command.length > 0) {
            this.createTerminal();
            this.terminal.show(true);
            this.terminal.sendText(this.getCommandByShell(command));
        }
    }

    execOnOutputChanel(command: string, cwd: string | undefined, isReturnOutput?: boolean): child_process.SpawnSyncReturns<string> | void {
        command = this.getCommandByShell(command);
        cwd = cwd ? this.generic.resolvePath(cwd) as string : cwd;
        this.generic.printOutputChannel("EXEC: " + command);

        let cmd = child_process.spawnSync(command, { cwd: cwd, encoding: 'utf8', shell: true });

        // Return output
        if (isReturnOutput) {
            return cmd;
        }

        // Print output
        if (cmd.stdout) {
            this.generic.printOutputChannel(cmd.stdout, { title: "STDOUT", isNewLine: true });
        }
        if (cmd.stderr) {
            this.generic.printOutputChannel(cmd.stderr, { title: "STDERR", isNewLine: true });
        }
        if (cmd.status !== 0) {
            this.generic.printOutputChannel(cmd.status, { title: "EXIT CODE", isNewLine: true });
        }
    }

    getTerminal(): vscode.Terminal {
        this.createTerminal();
        return this.terminal;
    }

    // TODO: NOT TESTED
    close() {
        if (!this.isClosed) {
            this.generic.runVscodeCommand('vscode workbench.action.terminal.kill', this.terminal.processId);
        }
    }
}