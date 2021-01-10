import { IExecCommand, IExecCommandResponse } from './interface/ssh-functions-interface';
import { IResponse } from './interface/generic-interface';
import { Config, NodeSSH, SSHExecCommandOptions } from 'node-ssh';
import { SshFunctionsMsgEnum } from './enum/ssh-functions-enum';
import { Generic } from './generic';

export class SshFunctions {
    nodessh: NodeSSH = new NodeSSH();

    constructor(
        private generic: Generic
    ) { }

    private _config: Config = {};
    set config(config: Config) {
        if (config !== this._config) {
            this.closeConnection();
        }
        this._config = config;
    }
    get config(): Config {
        return this._config;
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
                    this.generic.printOutputChannel("Connected on IP: " + this.config.host);
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
            this.config = {};
        }
    }

    execCmdWithStreaming(cmd: string, args: string[], cwd: string | undefined, callback: (onStdout?: Buffer | undefined, onStderr?: Buffer | undefined) => void) {
        if (!this.nodessh.isConnected()) {
            this.connect();
        }

        if (this.nodessh.isConnected()) {
            this.generic.getMessageSeparator('SSH FUNCTIONS');
            let options: SSHExecCommandOptions = {
                cwd: cwd,

            };
            this.nodessh.exec(cmd, args, {
                cwd: cwd,
                onStderr: (data) => { callback(undefined, data); },
                onStdout: (data) => { callback(data); }
            }).then(res => {
                this.generic.printOutputChannel("SSH Functions: Execution terminated");
            });
        } else {
            callback(undefined, Buffer.from(SshFunctionsMsgEnum.msgIsNotConnected));
        }
    }

    async execCommands(commands: IExecCommand[], isSquence?: boolean): Promise<IExecCommandResponse[]> {
        let response: IExecCommandResponse[] = [];
        for (const key in commands) {
            this.generic.printOutputChannel("Exec: " + commands[key].command);
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