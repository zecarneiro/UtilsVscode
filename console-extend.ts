import { LibStatic } from './lib-static';
import { Terminal, TerminalOptions, window, OutputChannel } from "vscode";
import { exec, SpawnOptionsWithoutStdio, SpawnSyncReturns, spawnSync, spawn } from 'child_process';
import { ITerminals, IShellCmd, IEnvVariable, IPrintOutputChannel } from './interface/console-extend-interface';
import { NotifyEnum, PlatformTypeEnum } from './enum/lib-enum';
import { ShellTypeEnum } from './enum/console-extends-enum';

export class ConsoleExtend {
    private directory = __dirname;
    private cwdKey = '{CWD}';
    private terminals: ITerminals = {
        powershell: undefined,
        bash: undefined,
        osxTerminal: undefined
    };

    constructor(private name: string) { }

    private _env: IEnvVariable = { outputChannel: { ...process.env }, terminal: {} };
    get env(): IEnvVariable {
        return LibStatic.copyJsonData(this._env);
    }
    set env(value: IEnvVariable) {
        this._env.outputChannel = LibStatic.jsonConcat(this.env.outputChannel, value.outputChannel);
        this._env.terminal = LibStatic.jsonConcat(this.env.terminal, value.terminal);
    }
    deleteEnv(key?: string) {
        let data: IEnvVariable = { outputChannel: {}, terminal: {} };
        if (key) {
            for (let keyData in this.env.outputChannel) {
                if (key !== keyData) {
                    data.outputChannel[keyData] = this.env.outputChannel[keyData];
                }
            }
            for (let keyData in this.env.terminal) {
                if (key !== keyData) {
                    data.terminal[keyData] = this.env.terminal[keyData];
                }
            }
        }
        this._env = LibStatic.copyJsonData(data);
    }
    get separatorEnv(): string {
        switch (LibStatic.getPlatform()) {
            case PlatformTypeEnum.linux:
                return ':';
            case PlatformTypeEnum.windows:
                return ';';
            case PlatformTypeEnum.osx:
                return '';
            default:
                throw new Error("Invalid Platform");
        }
    }

    private bash(): IShellCmd {
        let data: IShellCmd = {
            name: this.name + ' - Bash',
            command: '',
            type: ShellTypeEnum.bash
        };
        if (LibStatic.getPlatform() === PlatformTypeEnum.linux) {
            data.command = 'bash';
        } else if (LibStatic.getPlatform() === PlatformTypeEnum.windows) {
            const gitPath = LibStatic.resolvePath<string>(`${LibStatic.readEnvVariable('PROGRAMFILES')}/Git`);
            if (LibStatic.fileExist(gitPath, true)) {
                data.command = LibStatic.resolvePath<string>(`${gitPath}/bin/bash.exe`);
            } else {
                LibStatic.notify("Not find git bash", NotifyEnum.error);
            }
        } else {
            LibStatic.notify("Invalid Platform", NotifyEnum.error);
        }
        return LibStatic.copyJsonData(data);
    }

    private powershell(): IShellCmd {
        let data: IShellCmd = {
            name: this.name + ' - Poweshell',
            command: 'powershell.exe',
            type: ShellTypeEnum.powershell
        };
        return LibStatic.copyJsonData(data);
    }

    private osxTerminal(): IShellCmd {
        let data: IShellCmd = {
            name: this.name + ' - OSX Terminal',
            command: '/Applications/Utilities/Terminal.app',
            type: ShellTypeEnum.osxTerminal
        };
        return LibStatic.copyJsonData(data);
    }

    getShell(type: ShellTypeEnum): IShellCmd {
        switch (type) {
            case ShellTypeEnum.system:
                if (LibStatic.getPlatform() === PlatformTypeEnum.linux) {
                    return this.getShell(ShellTypeEnum.bash);
                } else if (LibStatic.getPlatform() === PlatformTypeEnum.osx) {
                    return this.getShell(ShellTypeEnum.osxTerminal);
                } else if (LibStatic.getPlatform() === PlatformTypeEnum.windows) {
                    return this.getShell(ShellTypeEnum.powershell);
                } else {
                    throw new Error("Invalid Platform");
                }
            case ShellTypeEnum.bash:
                return this.bash();
            case ShellTypeEnum.powershell:
                return this.powershell();
            case ShellTypeEnum.osxTerminal:
                return this.osxTerminal();
            case ShellTypeEnum.powershell:
                return this.powershell();
            default:
                throw new Error("Invalid Shell type");
        }
    }

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
        if (cwd && cwd.length > 0 && this._terminal) {
            const changeDirectory = `cd "${cwd}"`;
            this.terminal.sendText(changeDirectory);
        }
    }

    private setTerminal(shellType?: ShellTypeEnum, cwd?: string) {
        let shell: IShellCmd | undefined;
        if (shellType === ShellTypeEnum.bash) {
            shell = this.getShell(shellType);
        } else if (shellType === ShellTypeEnum.powershell) {
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
                            shellPath: shell.command,
                            env: this.env.terminal
                        });
                    }
                    this._terminal = this.terminals.bash;
                    break;
                case ShellTypeEnum.powershell:
                    if (!this.terminals.powershell) {
                        this.terminals.powershell = window.createTerminal({
                            cwd: cwd,
                            name: shell.name,
                            shellPath: shell.command,
                            env: this.env.terminal
                        });
                    }
                    this._terminal = this.terminals.powershell;
                    break;
                case ShellTypeEnum.osxTerminal:
                    if (!this.terminals.osxTerminal) {
                        this.terminals.osxTerminal = window.createTerminal({
                            cwd: cwd,
                            name: shell.name,
                            shellPath: shell.command,
                            env: this.env.terminal
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
                } else if (term.name === this.terminals.powershell?.name) {
                    this.terminals.powershell = undefined;
                } else if (term.name === this.terminals.osxTerminal?.name) {
                    this.terminals.osxTerminal = undefined;
                }
                this._terminal = undefined;
            });
        }
    }

    openTerminal(shellType: ShellTypeEnum, cwd?: string) {
        switch (shellType) {
            case ShellTypeEnum.bash:
                if (!this.terminals.bash) {
                    this.setTerminal(shellType, cwd);
                }
                this.terminals.bash?.show();
                break;
            case ShellTypeEnum.powershell:
                if (!this.terminals.powershell) {
                    this.setTerminal(shellType, cwd);
                }
                this.terminals.powershell?.show();
                break;
            case ShellTypeEnum.osxTerminal:
                if (!this.terminals.osxTerminal) {
                    this.setTerminal(shellType, cwd);
                }
                this.terminals.osxTerminal?.show();
                break;
            case ShellTypeEnum.system:
                this.setTerminal(shellType, cwd);
                this.openTerminal(this.getShell(ShellTypeEnum.system).type);
                break;
            default:
                break;
        }
    }

    execTerminal(command: string, cwd?: string, shellType?: ShellTypeEnum) {
        if (command && command.length > 0) {
            if (!this.terminal || shellType) {
                this.setTerminal(shellType, cwd);
            }
            this.changeDir(cwd);
            this.terminal.show(true);
            this.terminal.sendText(command);

        }
    }

    createTerminal(options: TerminalOptions): Terminal {
        options['name'] = this.name + ': ' + options?.name;
        window.terminals.forEach(terminalActive => {
            if (terminalActive.name === options.name) {
                return terminalActive;
            }
        });
        options['shellPath'] = !options.shellPath
            ? this.getShell(ShellTypeEnum.system).command
            : options.shellPath;
        options['env'] = !options.env ? this.env.terminal : options.env;

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
     *! Output Channel
     *=============================================**/
    private _outputChannel: OutputChannel | undefined;
    get outputChannel(): OutputChannel {
        if (!this._outputChannel) {
            this._outputChannel = window.createOutputChannel(this.name);
        }
        return this._outputChannel;
    }

    execOutputChannel(command: string, options?: SpawnOptionsWithoutStdio & { isWait?: boolean, printCmd?: boolean }, callback?: (output?: any, error?: Error, end?: any) => void): SpawnSyncReturns<Buffer> | undefined {
        let processResult = (data?: any, error?: any, end?: any) => {
            if (data) {
                data = data.toString();
                if (callback) {
                    callback(data);
                } else {
                    this.onOutputChannel(data);
                }
            } else if (error) {
                error = new Error(error);
                if (callback) {
                    callback(undefined, error);
                } else {
                    this.onOutputChannel(error);
                }
            } else {
                if (callback) {
                    callback(undefined, undefined, end);
                } else {
                    this.onOutputChannel(end);
                }
            }
        };
        options = options ? options : {};
        options['shell'] = options.shell ? options.shell : this.getShell(ShellTypeEnum.system).command;
        options['env'] = this.env.outputChannel;

        if (options.printCmd) {
            this.onOutputChannel("EXEC: " + command);
        }

        if (options?.isWait) {
            return spawnSync(command, options);
        }

        let cmd = spawn(command, options);

        // Data
        cmd.stdout.on('data', result => {
            processResult(result);
        });


        // Error
        cmd.on('error', error => {
            processResult(undefined, error);
        });
        cmd.on('uncaughtException', error => {
            processResult(undefined, error);
        });
        cmd.stderr.on('data', (error: any) => {
            processResult(undefined, error);
        });

        // End, Close and Exit
        cmd.stdout.on('end', (result: any) => {
            processResult(undefined, undefined, result);
        });
        cmd.on('close', (code, signal) => {
            processResult(undefined, undefined, { code: code, signal: signal });
        });
        cmd.on('exit', (code) => {
            processResult(undefined, undefined, { code: code });
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

        if (data !== undefined && data !== null && typeof data !== "string") {
            data = JSON.stringify(data, null, spaceObj);
        }

        // Clear
        if (config.isClear) {
            this.outputChannel.clear();
        }

        // Print separator
        if (config.hasSeparator) {
            this.outputChannel.append(LibStatic.getMessageSeparator(config.title));
            config.isNewLine = false;
        } else if (config.hasDate) {
            this.outputChannel.append(`${LibStatic.formatDate()} - `);
            config.isNewLine = false;
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
     *! Others
     *=============================================**/
    runCommandPowerShellAsAdmin(command: string, cwd?: string) {
        let adminCmd = `Start-Process powershell -verb runas -ArgumentList "${command}"`;
        this.execOutputChannel(adminCmd, { cwd: cwd }, (output, error, isEnd) => {
            if (isEnd) {
                LibStatic.notify("Please Restart VSCode");
            }
        });
    }

    findCommandPath(command: string): string {
        if (command && command.length > 0) {
            let execCmd = "";
            switch (LibStatic.getPlatform()) {
                case PlatformTypeEnum.linux:
                    execCmd = `which ${command}`;
                    break;
                case PlatformTypeEnum.windows:
                    execCmd = `where.exe ${command}`;
                    break;
                default:
                    return '';
            }
            let result = this.execOutputChannel(execCmd, { isWait: true, shell: this.getShell(ShellTypeEnum.system).command });
            if (result?.stdout) {
                return result.stdout?.toString().trim();
            }
        }
        return '';
    }

    sequenceCommands(commands: string[], shellType: ShellTypeEnum): string {
        let commandSequency = '';
        let separatorCmd = '';
        const separators = {
            win: '&&',
            linux: '&&',
            osx: '&&'
        };

        if (shellType === ShellTypeEnum.system) {
            switch (LibStatic.getPlatform()) {
                case PlatformTypeEnum.windows:
                    separatorCmd = separators.win;
                    break;
                case PlatformTypeEnum.linux:
                    separatorCmd = separators.linux;
                    break;
                case PlatformTypeEnum.osx:
                    separatorCmd = separators.osx;
                    break;
                default:
                    throw new Error("Ivalid Platform");
            }
        } else {
            switch (shellType) {
                case ShellTypeEnum.powershell:
                    separatorCmd = separators.win;
                    break;
                case ShellTypeEnum.bash:
                    separatorCmd = separators.linux;
                    break;
                case ShellTypeEnum.osxTerminal:
                    separatorCmd = separators.osx;
                    break;
                default:
                    throw new Error("Ivalid Shell");
            }
        }

        commands.forEach(cmd => {
            if (commandSequency.length === 0) {
                commandSequency = cmd;
            } else {
                commandSequency += ` ${separatorCmd} ${cmd}`;
            }
        });
        return commandSequency;
    }
}
