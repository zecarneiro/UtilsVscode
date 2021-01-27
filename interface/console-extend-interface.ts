import { Terminal } from "vscode";

export interface IPrintOutputChannel {
    isNewLine: boolean,
    hasSeparator?: boolean,
    title?: string,
    isClear?: boolean,
    encoding?: string
}
export interface ITerminals {
    wsl: Terminal | undefined,
    powershell: Terminal | undefined,
    gitBash: Terminal | undefined,
    bash: Terminal | undefined
}