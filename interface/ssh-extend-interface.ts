import { SSHExecCommandOptions, SSHExecCommandResponse } from "node-ssh";

export interface IExecCommand {
    command: string,
    options: SSHExecCommandOptions | undefined
}
export interface IExecCommandResponse {
    command: string,
    response: SSHExecCommandResponse
}