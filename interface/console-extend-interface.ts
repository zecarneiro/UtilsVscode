import { ShellTypeEnum } from './../enum/console-extends-enum';
import { Terminal } from "vscode";

export interface IPrintOutputChannel {
    isNewLine: boolean,
    hasSeparator?: boolean,
    title?: string,
    isClear?: boolean,
    encoding?: string,
    hasDate?: boolean
}
export interface ITerminals {
    powershell: Terminal | undefined,
    bash: Terminal | undefined,
    osxTerminal: Terminal | undefined
}
export interface IShellCmd {
    name: string,
    command: string,
    type: ShellTypeEnum
}
export interface IEnvVariable {
    outputChannel: NodeJS.ProcessEnv,
    terminal: { [key: string]: string | null }
}