# UtilsVscode
Utils for vscode extensions

## First Configuration
Go to `package.json` and merge
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
Where `PATH_FOR_UTILS` are utils project directory
