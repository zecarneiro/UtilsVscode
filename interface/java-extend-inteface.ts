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

export interface IJavaVmExtend {
    jarFile: string,
    vmOptions?: string[]
}