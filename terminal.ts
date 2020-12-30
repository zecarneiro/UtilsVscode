import * as vscode from 'vscode';

export class Terminal {
    private terminal: vscode.Terminal | any;
    private shellCmd: string = '';

    constructor(
        private appName: string,
    ) {
        vscode.window.onDidCloseTerminal(term => {
            this.terminal = undefined;
        });
        this.createTerminal();

        // Set Shell Command
        switch (process.platform) {
            case 'linux':
                this.shellCmd = 'bash -c \"{0}\"';
            case 'win32':
                this.shellCmd = 'powershell -command \"{0}\"';
        }
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
            command = this.shellCmd.replace('{0}', command);
            this.terminal.sendText(command);
        }
    }

    getTerminal(): vscode.Terminal {
        this.createTerminal();
        return this.terminal;
    }
}