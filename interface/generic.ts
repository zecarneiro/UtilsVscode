export interface IStringReplace {
    search: string;
    toReplace: string;
}
export interface IRegVsCmd {
    command: string;
    callback: (...args: any[]) => any;
    thisArg?: any;
}
export interface IResponse<T> {
    status: boolean,
    data: T,
    message: string
}