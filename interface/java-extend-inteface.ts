import { IFileInfo } from './lib-interface';

export interface IJavaExtend {
    file: IFileInfo,
    method?: string,
    pomDir?: string,
    otherArgs?: string[]
}