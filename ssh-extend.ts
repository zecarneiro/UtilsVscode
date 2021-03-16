import { LibStatic } from './lib-static';
import { ConsoleExtend } from './console-extend';
import { Config, NodeSSH } from "node-ssh";
import { SshFunctionsMsgEnum } from "./enum/ssh-extend-enum";
import { IResponse } from "./interface/lib-interface";
import { IExecCommand, IExecCommandResponse } from './interface/ssh-extend-interface';

export class SshExtend {
    nodessh: NodeSSH = new NodeSSH();

    constructor(
        private console: ConsoleExtend
    ) { }

    private _config: Config = {};
    set config(config: Config) {
        if (config !== this._config) {
            this.closeConnection();
        }
        this._config = config ? LibStatic.copyJsonData(config) : {};
    }
    get config(): Config {
        return LibStatic.copyJsonData(this._config);
    }

    private isValidConfig(): boolean {
        return Object.keys(this._config).length > 0;
    }

    async connect(): Promise<IResponse<NodeSSH>> {
        let response: IResponse<NodeSSH> = {
            data: {} as NodeSSH,
            error: undefined
        };
        if (!this.isValidConfig()) {
            response.error = Error(SshFunctionsMsgEnum.msgInvalidConfig);
            return response;
        }

        if (!this.nodessh.isConnected()) {
            await this.nodessh.connect(this.config).then(value => {
                if (value.isConnected()) {
                    this.nodessh = value;
                    response.data = this.nodessh;
                    this.console.onOutputChannel("Connected on IP: " + this.config.host);
                }
            }).catch(reason => {
                response.error = Error(reason);
            });
        } else {
            response.data = this.nodessh;
        }
        return response;
    }

    closeConnection() {
        if (this.nodessh.isConnected()) {
            this.nodessh.connection?.end();
            this._config = {};
        }
    }

    execCmdWithStreaming(cmd: string, args: string[], cwd: string | undefined, callback: (onStdout?: Buffer | undefined, onStderr?: Buffer | undefined) => void) {
        if (!this.nodessh.isConnected()) {
            this.connect();
        }

        if (this.nodessh.isConnected()) {
            LibStatic.getMessageSeparator('SSH FUNCTIONS');
            this.nodessh.exec(cmd, args, {
                cwd: cwd,
                onStderr: (data) => { callback(undefined, data); },
                onStdout: (data) => { callback(data); }
            }).then(res => {
                this.console.onOutputChannel("SSH Functions: Execution terminated");
            });
        } else {
            callback(undefined, Buffer.from(SshFunctionsMsgEnum.msgIsNotConnected));
        }
    }

    async execCommands(commands: IExecCommand[], isSquence?: boolean): Promise<IExecCommandResponse[]> {
        let response: IExecCommandResponse[] = [];
        for (const key in commands) {
            this.console.onOutputChannel("Exec: " + commands[key].command);
            let res = await this.nodessh.execCommand(commands[key].command, commands[key].options && { execOptions: { pty: true } });
            response.push({
                command: commands[key].command,
                response: res
            });

            if (isSquence && res.stderr) {
                return response;
            }
        }
        return response;
    }
}