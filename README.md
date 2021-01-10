# UtilsVscode
Utils for vscode extensions

## First Configuration
1. Go to `package.json` and merge
```json
...
"scripts": {
    ...
    "compile": "... && npm run prepare:utils",
    ...
    "prepare:utils": "bash -c \"./src/utils/scripts/prepare-utils.sh \"$PWD\" \"$PWD/PATH_FOR_UTILS\"\""
}
...
```

2. Node Dependencies
    - `npm install fs-extra @types/fs-extra`
    - `npm install @types/node-ssh node-ssh @types/ssh2 ssh2 @types/ssh2-streams`
    - `npm install moment`

Where `PATH_FOR_UTILS` are utils project directory
