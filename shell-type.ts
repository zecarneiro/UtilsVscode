import { LibStatic } from "./lib-static";
import { PlatformTypeEnum } from "./enum/lib-enum";

export class ShellType {
    static readonly bash = 'Not Implemented yet!!!';
    static readonly powershell = 'powershell.exe';
    static readonly wsl = 'bash.exe';
    static get gitBash(): string {
        let shell = LibStatic.resolvePath<string>(LibStatic.readEnvVariable('SYSTEMDRIVE') + '/Program Files (x86)/Git/bin/bash.exe');
        return LibStatic.fileExist(shell)
            ? shell
            : LibStatic.resolvePath<string>(LibStatic.readEnvVariable('PROGRAMFILES') + '/Git/bin/bash.exe');
    }
    static get system(): string {
        switch (LibStatic.getPlatform()) {
            case PlatformTypeEnum.linux:
                return ShellType.bash;
            case PlatformTypeEnum.windows:
                return ShellType.powershell;
            default:
                return '';
        }
    }
}