# UtilsVscode
Utils for vscode extensions

## Prepare UTILS
Use `package.json` or `javascript` caller
- On `package.json` file
```json
...
"scripts": {
    ...
    "compile": "... && npm run prepare:utils",
    ...
    "prepare:utils": "node ...\\utils\\scripts\\prepare-utils.js root-extension-dir utils-dir --shell"
}
...
```
- On your `javascript` file

```js
...
var PrepareUtils = require(resolvePath('./.../utils/scripts/prepare-utils'));

PrepareUtils("root-extension-dir", "utils-dir");
...
```


## Node Dependencies
    - `npm install fs-extra @types/fs-extra`
    - `npm install @types/node-ssh node-ssh @types/ssh2 ssh2 @types/ssh2-streams`
    - `npm install moment`

Where `PATH_FOR_UTILS` are utils project directory
