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

    execCmdWithStreaming(cmd: string, args: string[], cwd: string, proccessNumber: number) {
        let title = 'Response for proccess: ' + proccessNumber;
        if (!this.nodessh.isConnected()) {
            this.connect();
        }

        if (this.nodessh.isConnected()) {
            this.generic.getMessageSeparator('SSH FUNCTIONS');
            let options: SSHExecCommandOptions = {
                cwd: cwd,
                onStderr: (data) => { this.generic.printOutputChannel(data, { isNewLine: true, title: title }); },
                onStdout: (data) => { this.generic.printOutputChannel(data, { isNewLine: true, title: title }); }
            };
            this.nodessh.exec(cmd, args, options);
        } else {
            this.generic.printOutputChannel(SshFunctionsMsgEnum.msgIsNotConnected);
        }
    }
}