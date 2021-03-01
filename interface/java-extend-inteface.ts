import { IFileInfo, IRunCmd } from './lib-interface';

export interface IJavaExtend {
    file: IFileInfo,
    isFailIfNoTests?: boolean,
    isClean?: boolean,
    method?: string,
    pomDir?: string,
    otherArgs?: string[],
    runCmdBeforeTest?: IRunCmd[],
}