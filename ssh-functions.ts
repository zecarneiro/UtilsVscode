import { IResponse } from './interface/generic';
import { Config, NodeSSH, SSHExecCommandOptions } from 'node-ssh';
import { SshFunctionsMsgEnum } from './enum/ssh-functions';
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
            status: false,
            data: undefined,
            message: ''
        };
        if (!this.isValidConfig()) {
            response.message = SshFunctionsMsgEnum.msgInvalidConfig;
            return response;
        }

        if (!this.nodessh.isConnected()) {
            await this.nodessh.connect(this.config).then(value => {
                if (value.isConnected()) {
                    this.nodessh = value;
                    response.status = true;
                    response.data = this.nodessh;
                    this.generic.printOutputChannel("Connected on IP: " + this.config.host, false);
                }
            }).catch(reason => {
                response.message = reason;
            });
        } else {
            response.status = true;
        }
        return response;
    }

    closeConnection() {
        if (this.nodessh.isConnected()) {
            this.nodessh.connection?.end();
            this.config = {};
        }
    }

    execCmdWithStreaming(cmd: string, args: string[], cwd: string, proccessNumber: number) {
        let title = 'Response for proccess: ' + proccessNumber;
        if (!this.nodessh.isConnected()) {
            this.connect();
        }

        if (this.nodessh.isConnected()) {
            this.generic.getMessageSeparator('SSH FUNCTIONS');
            let options: SSHExecCommandOptions = {
                cwd: cwd,
                onStderr: (data) => { this.generic.printOutputChannel(data, true, title); },
                onStdout: (data) => { this.generic.printOutputChannel(data, true, title); }
            };
            this.nodessh.exec(cmd, args, options);
        } else {
            this.generic.printOutputChannel(SshFunctionsMsgEnum.msgIsNotConnected);
        }
    }
}