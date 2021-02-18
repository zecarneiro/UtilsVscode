import { LibStatic } from './lib-static';
import { OutputChannel, Terminal, TerminalOptions, Uri, window } from "vscode";
import { exec, spawn, SpawnOptionsWithoutStdio, spawnSync, SpawnSyncReturns } from 'child_process';
import { IPrintOutputChannel, ITerminals, IShellCmd, IEnvVariable } from './interface/console-extend-interface';
import { NotifyEnum, PlatformTypeEnum } from './enum/lib-enum';
import { ShellTypeEnum } from './enum/console-extends-enum';

export class ConsoleExtend {
    private cwdKey = '{CWD}';
    private terminals: ITerminals = {
        cmd: undefined,
        bash: undefined,
        osxTerminal: undefined
    };

    constructor(
        private name: string
    ) { }

    private _env: IEnvVariable = {outputChannel: {...process.env}, terminal: {}};
    get env(): IEnvVariable {
        return LibStatic.copyJsonData(this._env);
    }
    set env(value: IEnvVariable) {
        this._env.outputChannel = LibStatic.jsonConcat(this.env.outputChannel, value.outputChannel);
        this._env.terminal = LibStatic.jsonConcat(this.env.terminal, value.terminal);
    }
    deleteEnv(key?: string) {
        let data: IEnvVariable = {outputChannel: {}, terminal: {}};
        if (key) {
            for (var keyData in this.env.outputChannel) {
                if (key !== keyData) {
                    data.outputChannel[keyData] = this.env.outputChannel[keyData];
                }
            }
            for (var keyData in this.env.terminal) {
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
                return  ':';
            case PlatformTypeEnum.windows:
                return ';';
            case PlatformTypeEnum.osx:
                return '';
            default:
                throw new Error("Invalid Platform");
        }
    }

    private bash(command?: string): IShellCmd {
        command = command ? command : '';
        let data: IShellCmd = {
            name: this.name + ' - Bash',
            command: '',
            type: ShellTypeEnum.bash,
            external: '',
            externalArgs: ''
        };
        if (LibStatic.getPlatform() === PlatformTypeEnum.linux) {
            data.command = 'bash';
            data.external = 'gnome-terminal';
            data.external = `--working-directory="${this.cwdKey}"`;

            if (command.length > 0) {
                data.externalArgs += ` -x ${data.command} -c "${command}"`;
            }
        } else if (LibStatic.getPlatform() === PlatformTypeEnum.windows) {
            const gitPath = LibStatic.resolvePath<string>(`${LibStatic.readEnvVariable('PROGRAMFILES')}/Git`);
            if (LibStatic.fileExist(gitPath, true)) {
                data.command = LibStatic.resolvePath<string>(`${gitPath}/bin/bash.exe`);
                const commandGit = `"${data.command}" --cd="${this.cwdKey}" --login`;
                let cmdData = this.cmd(commandGit);
                data.external = cmdData.external;
                data.externalArgs = cmdData.externalArgs;
                if (command.length > 0) {
                    data.externalArgs = `${data.externalArgs} -i -l -c "${command}; exec bash"`;
                }
            }
        } else {
            LibStatic.notify("Invalid Platform", NotifyEnum.error);
        }
        return LibStatic.copyJsonData(data);
    }

    private cmd(command?: string): IShellCmd {
        command = command ? command : '';
        let data: IShellCmd = {
            name: this.name + ' - CMD',
            command: 'cmd.exe',
            type: ShellTypeEnum.cmd,
            external: 'cmd',
            externalArgs: `/K start "" /d "${this.cwdKey}" ${command}`
        };
        return LibStatic.copyJsonData(data);
    }

    private powershell(command?: string): IShellCmd {
        command = command ? command : '';
        let data: IShellCmd = {
            name: this.name + ' - Poweshell',
            command: 'powershell.exe',
            type: ShellTypeEnum.powershell,
            external: '',
            externalArgs: `${command}`
        };
        return LibStatic.copyJsonData(data);
    }

    private osxTerminal(command?: string): IShellCmd {
        command = command ? command : '';
        let data: IShellCmd = {
            name: this.name + ' - OSX Terminal',
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
                    return this.getShell(ShellTypeEnum.bash, command);
                } else if (LibStatic.getPlatform() === PlatformTypeEnum.osx) {
                    return this.getShell(ShellTypeEnum.osxTerminal, command);
                } else if (LibStatic.getPlatform() === PlatformTypeEnum.windows) {
                    return this.getShell(ShellTypeEnum.cmd, command);
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
            this._outputChannel = window.createOutputChannel(this.name);
        }
        return this._outputChannel as OutputChannel;
    }

    execOutputChannel(command: string, options?: SpawnOptionsWithoutStdio & {isWait?: boolean, printCmd?: boolean}, callback?: (output?: any, error?: Error, end?: any) => void): SpawnSyncReturns<Buffer> | undefined {
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
                            shellPath: shell.command,
                            env: this.env.terminal
                        });
                    }
                    this._terminal = this.terminals.bash;
                    break;
                case ShellTypeEnum.cmd:
                    if (!this.terminals.cmd) {
                        this.terminals.cmd = window.createTerminal({
                            cwd: cwd,
                            name: shell.name,
                            shellPath: shell.command,
                            env: this.env.terminal
                        });
                    }
                    this._terminal = this.terminals.cmd;
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
                } else if (term.name === this.terminals.cmd?.name) {
                    this.terminals.cmd = undefined;
                } else if (term.name === this.terminals.osxTerminal?.name) {
                    this.terminals.osxTerminal = undefined;
                }
                this._terminal = undefined;
            });
        }
    }

    execTerminal(command: string,  cwd?: string, shellType?: ShellTypeEnum) {
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
        options['name'] = this.name + ': ' + options?.name;
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
     *! External
     *=============================================**/
    execExternal(shell: ShellTypeEnum, cwd: string, command?: string) {
        if (LibStatic.fileExist(cwd, true)) {
            let typeShellData = this.getShell(shell, command);
            let base: string = typeShellData.external;
            let args: string = LibStatic.stringReplaceAll(typeShellData.externalArgs, [
                { search: this.cwdKey, toReplace: cwd }
            ]);

            if (base && base.length > 0) {
                base += ' ' + args;
                let consoleProcess = exec(base, {env: this.env.outputChannel});
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

    /**============================================
     *! Others
     *=============================================**/
    runCommandPowerShellAsAdmin(command: string, cwd?: string) {
        let adminCmd = `Start-Process powershell -verb runas -ArgumentList "${command}"`;
        this.execOutputChannel(adminCmd, {cwd: cwd}, (undefined, undefine, isEnd) => {
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
                    execCmd = `where ${command}`;
                    break;
                default:
                    return '';
            }
            let result = this.execOutputChannel(execCmd, {isWait: true, shell: this.getShell(ShellTypeEnum.system).command});
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
                case ShellTypeEnum.cmd | ShellTypeEnum.powershell:
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
