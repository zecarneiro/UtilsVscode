import { LibStatic } from './lib-static';
import { OutputChannel, Terminal, TerminalOptions, Uri, window } from "vscode";
import { exec, spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { IPrintOutputChannel, ITerminals, IShellCmd } from './interface/console-extend-interface';
import { NotifyEnum, PlatformTypeEnum } from './enum/lib-enum';
import { ShellTypeEnum } from './enum/console-extends-enum';

export class ConsoleExtend {
    private cwdKey = '{CWD}';
    private commandsKey = '{COMMANDS}';
    private terminals: ITerminals = {
        cmd: undefined,
        bash: undefined,
        osxTerminal: undefined
    };

    constructor(
        private extensionId: string
    ) { }

    private bash(command?: string): IShellCmd {
        let data: IShellCmd = {
            name: this.extensionId + ' - Bash',
            command: '',
            type: ShellTypeEnum.bash,
            external: '',
            externalArgs: ''
        };
        if (LibStatic.getPlatform() === PlatformTypeEnum.linux) {
            data.command = 'bash';
            data.external = 'gnome-terminal';
            data.external = `--working-directory="${this.cwdKey}" -x ${data.command} -c "${this.commandsKey}"`;
        } else if (LibStatic.getPlatform() === PlatformTypeEnum.windows) {
            const gitPath = LibStatic.resolvePath<string>(`${LibStatic.readEnvVariable('PROGRAMFILES')}/Git`);
            if (LibStatic.fileExist(gitPath, true)) {
                data.command = LibStatic.resolvePath<string>(`${gitPath}/bin/bash.exe`);
                const commandGit = `"${data.command}" --cd="${this.cwdKey}" --login`;
                let cmdData = this.cmd(commandGit);
                data.external = cmdData.external;
                data.externalArgs = cmdData.externalArgs;
                if (command && command.length > 0) {
                    data.externalArgs = `${data.externalArgs} -i -l -c "${this.commandsKey}; exec bash"`;
                }
            }
        } else {
            LibStatic.notify("Invalid Platform", NotifyEnum.error);
        }
        return LibStatic.copyJsonData(data);
    }

    private cmd(command?: string): IShellCmd {
        let data: IShellCmd = {
            name: this.extensionId + ' - CMD',
            command: 'cmd.exe',
            type: ShellTypeEnum.cmd,
            external: 'cmd',
            externalArgs: `/K start "" /d "${this.cwdKey}" ${command}`
        };
        return LibStatic.copyJsonData(data);
    }

    private powershell(command?: string): IShellCmd {
        let data: IShellCmd = {
            name: this.extensionId + ' - Poweshell',
            command: 'powershell.exe',
            type: ShellTypeEnum.powershell,
            external: '',
            externalArgs: `${command}`
        };
        return LibStatic.copyJsonData(data);
    }

    private osxTerminal(command?: string): IShellCmd {
        let data: IShellCmd = {
            name: this.extensionId + ' - OSX Terminal',
            command: '/Applications/Utilities/Terminal.app',
            type: ShellTypeEnum.osxTerminal,
            external: 'open',
            externalArgs: ''
        };
        data.externalArgs = `-n -a ${data.command} "${this.cwdKey}" ${command}`;
        return LibStatic.copyJsonData(data);
    }

    getShell(type: ShellTypeEnum, command?: string): IShellCmd {
        switch (type) {
            case ShellTypeEnum.system:
                if (LibStatic.getPlatform() === PlatformTypeEnum.linux) {
                    return this.getShell(ShellTypeEnum.bash);
                } else if (LibStatic.getPlatform() === PlatformTypeEnum.osx) {
                    return this.getShell(ShellTypeEnum.osxTerminal);
                } else if (LibStatic.getPlatform() === PlatformTypeEnum.windows) {
                    return this.getShell(ShellTypeEnum.cmd);
                } else {
                    throw new Error("Invalid Platform");
                }
            case ShellTypeEnum.bash:
                return this.bash(command);
            case ShellTypeEnum.cmd:
                return this.cmd(command);
            case ShellTypeEnum.osxTerminal:
                return this.osxTerminal(command);
            case ShellTypeEnum.powershell:
                return this.powershell(command);
            default:
                throw new Error("Invalid Shell type");
        }
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

    execOutputChannel(command: string, cwd?: string, shell?: ShellTypeEnum) {
        let options: SpawnOptionsWithoutStdio = {
            cwd: cwd,
            shell: shell ? this.getShell(shell).command : this.getShell(ShellTypeEnum.system).command
        };
        this.onOutputChannel("EXEC: " + command);

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
            this.setTerminal(ShellTypeEnum.system);
        }
        return this._terminal as Terminal;
    }

    private changeDir(cwd?: string) {
        if (this._terminal && cwd && cwd.length > 0) {
            this.terminal.sendText(`cd "${cwd}"`);
        }
    }

    private setTerminal(shellType: ShellTypeEnum, cwd?: string) {
        let shell: IShellCmd | undefined;
        if (shellType === ShellTypeEnum.bash) {
            shell = this.getShell(shellType);
        } else if (shellType === ShellTypeEnum.cmd) {
            shell = this.getShell(shellType);
        } else if (shellType === ShellTypeEnum.osxTerminal) {
            shell = this.getShell(shellType);
        } else {
            shell = this.getShell(ShellTypeEnum.system);
        }

        if (shell) {
            switch (shell.type) {
                case ShellTypeEnum.bash:
                    if (!this.terminals.bash) {
                        this.terminals.bash = window.createTerminal({
                            cwd: cwd,
                            name: shell.name,
                            shellPath: shell.command
                        });
                    }
                    this._terminal = this.terminals.bash;
                    break;
                case ShellTypeEnum.cmd:
                    if (!this.terminals.cmd) {
                        this.terminals.cmd = window.createTerminal({
                            cwd: cwd,
                            name: shell.name,
                            shellPath: shell.command
                        });
                    }
                    this._terminal = this.terminals.cmd;
                    break;
                case ShellTypeEnum.osxTerminal:
                    if (!this.terminals.osxTerminal) {
                        this.terminals.osxTerminal = window.createTerminal({
                            cwd: cwd,
                            name: shell.name,
                            shellPath: shell.command
                        });
                    }
                    this._terminal = this.terminals.osxTerminal;
                    break;
                default:
                    throw new Error("Invalid Shell");
            }

            window.onDidCloseTerminal(term => {
                if (term.name === this.terminals.bash?.name) {
                    this.terminals.bash = undefined;
                } else if (term.name === this.terminals.cmd?.name) {
                    this.terminals.cmd = undefined;
                } else if (term.name === this.terminals.osxTerminal?.name) {
                    this.terminals.osxTerminal = undefined;
                }
                this._terminal = undefined;
            });
        }
    }

    execTerminal(command: string, cwd?: string, shellType?: ShellTypeEnum) {
        if (command && command.length > 0) {
            if (shellType) {
                this.setTerminal(shellType, cwd);
            }
            this.changeDir(cwd);
            this.terminal.show(true);
            this.terminal.sendText(command);
        }
    }

    createTerminal(options: TerminalOptions): Terminal {
        if (!options.shellPath) {
            options = { shellPath: this.getShell(ShellTypeEnum.system).command };
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

    /**============================================
     *! External
     *=============================================**/
    execExternal(shell: ShellTypeEnum, cwd: string, command?: string) {
        if (LibStatic.fileExist(cwd, true)) {
            let typeShellData = this.getShell(shell, command);
            let base: string = typeShellData.external;
            let args: string = LibStatic.stringReplaceAll(typeShellData.externalArgs, [
                { search: this.cwdKey, toReplace: cwd },
                { search: this.commandsKey, toReplace: command ? command : '' }
            ]);

            if (base && base.length > 0) {
                base += ' ' + args;
                let consoleProcess = exec(base);
                consoleProcess.on('error', error => {
                    this.onOutputChannel(error);
                });
                consoleProcess.on('uncaughtException', error => {
                    this.onOutputChannel(error);
                });
                consoleProcess.on('exit', (code) => {
                    this.onOutputChannel('External Terminal EXIT CODE: ' + code);
                });
            }
        } else {
            this.onOutputChannel('External Terminal: Invalid Path = ' + cwd);
        }
    }
}