import { LibStatic } from './lib-static';
import { OutputChannel, Terminal, TerminalOptions, Uri, window } from "vscode";
import { ShellType } from './shell-type';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { IPrintOutputChannel, ITerminals } from './interface/console-extend-interface';
import { PlatformTypeEnum } from './enum/lib-enum';

export class ConsoleExtend {
    private terminals: ITerminals = {
        wsl: undefined,
        powershell: undefined,
        gitBash: undefined,
        bash: undefined
    };

    constructor(
        private extensionId: string
    ) {
        window.onDidCloseTerminal(term => {
            this._terminal = undefined;
        });
    }

    /**============================================
     *! Output Channel
     *=============================================**/
    private _outputChannel: OutputChannel | undefined;
    get outputChannel(): OutputChannel {
        if (!this._outputChannel) {
            this._outputChannel = window.createOutputChannel(this.extensionId);
        }
        return this._outputChannel as OutputChannel;
    }

    execOutputChannel(command: string, options?: SpawnOptionsWithoutStdio | undefined) {
        this.onOutputChannel("EXEC: " + command);
        if (!options || !options.shell) {
            options = { shell: ShellType.system };
        }

        let cmd = spawn(command, options);

        cmd.stdout.on('data', result => {
            this.onOutputChannel(result);
        });
        cmd.stdout.on('end', (result: any) => {
            this.onOutputChannel(result);
        });

        cmd.on('error', error => {
            this.onOutputChannel(error);
        });
        cmd.on('uncaughtException', error => {
            this.onOutputChannel(error);
        });
        cmd.stderr.on('data', (error: any) => {
            this.onOutputChannel(error);
        });


        cmd.on('close', (code, signal) => {
            this.onOutputChannel({ code: code, signal: signal });
        });
        cmd.on('exit', (code) => {
            this.onOutputChannel({ code: code });
            // at exit explicitly kill exited task
            cmd.kill('SIGINT');
        });
    }

    onOutputChannel(data: any, options?: IPrintOutputChannel) {
        let spaceObj = 4;
        let config: IPrintOutputChannel = options ? options : {
            isNewLine: true,
        };
        if (!config.encoding) {
            config.encoding = 'utf8';
        }

        if (config.hasSeparator) {
            data = LibStatic.getMessageSeparator(config.title) + data;
            config.isNewLine = false;
        }
        if (config.isClear) {
            this.outputChannel.clear();
        }

        if (data !== undefined && data !== null && typeof data !== "string") {
            data = JSON.stringify(data, null, spaceObj);
        }

        if (config.isNewLine) {
            this.outputChannel.appendLine(data);
        } else {
            this.outputChannel.append(data);
        }
        this.outputChannel.show();
    }
    /*=============== END OF SECTION ==============*/

    /**============================================
     *! Terminal
     *=============================================**/
    private _terminal: Terminal | undefined;
    get terminal(): Terminal {
        if (!this._terminal) {
            this.setTerminal(ShellType.system);
        }
        return this._terminal as Terminal;
    }

    private changeDir(cwd?: string) {
        if (this._terminal && cwd && cwd.length > 0) {
            this.terminal.sendText(`cd '${cwd}'`);
        }
    }

    private setTerminal(shellType: ShellType, cwd?: string | Uri) {
        if (shellType === ShellType.bash || (shellType === ShellType.system && shellType === ShellType.bash)) {
            if (LibStatic.getPlatform() === PlatformTypeEnum.windows) {
                this.setTerminal(ShellType.gitBash, cwd);
            } else {
                this.onOutputChannel(ConsoleExtend.name + ": Not implemented yet");
            }
        } else if (shellType === ShellType.powershell || (shellType === ShellType.system && shellType === ShellType.powershell)) {
                if (!this.terminals.powershell) {
                    this.terminals.powershell = window.createTerminal({
                        cwd: cwd,
                        name: this.extensionId + ' - Powershell',
                        shellPath: ShellType.powershell
                    });
                }
                this._terminal = this.terminals.powershell;
        } else if (shellType === ShellType.gitBash) {
            if (!this.terminals.gitBash) {
                this.terminals.gitBash = window.createTerminal({
                    cwd: cwd,
                    name: this.extensionId + ' - Git Bash',
                    shellPath: ShellType.gitBash
                });
            }
            this._terminal = this.terminals.gitBash;
        } else if (shellType === ShellType.gitBash) {
            this.terminals.wsl = window.createTerminal({
                cwd: cwd,
                name: this.extensionId + ' - WSL',
                shellPath: ShellType.wsl
            });
            this._terminal = this.terminals.wsl;
        }
    }

    execTerminal(command: string, cwd?: string, shellType?: ShellType) {
        if (command && command.length > 0) {
            if (shellType) {
                this.setTerminal(shellType);
            }
            this.changeDir(cwd);
            this.terminal.show(true);
            this.terminal.sendText(command);
        }
    }

    createTerminal(options: TerminalOptions): Terminal {
        if (!options.shellPath) {
            options = { shellPath: ShellType.system };
        }
        
        options['name'] = this.extensionId + ': ' + options?.name;
        let term = window.terminals.find(t => t.name === options?.name);
        if (term) {
            return term;
        }
        return window.createTerminal(options);
    }

    async closeTerminal(processId: number) {
        if (this._terminal) {
            await LibStatic.runVscodeCommand('workbench.action.terminal.kill', processId);
        }
    }
}