'use strict';
var fse = require("fs-extra");
var path = require("path");

const PrepareUtils = (rootDir, utilsDir) => {
    const resolvePath = (strPath) => {
        return path.resolve(strPath);
    };

    try {
        if (!fse.existsSync(rootDir) || !fse.existsSync(utilsDir)) {
            throw new Error(`Invalid directories: "${rootDir}" or "${utilsDir}"`);
        }
        const binDir = resolvePath(`${utilsDir}/bin`);
        const utilsRootDir = resolvePath(`${rootDir}/utils`);
        if (!fse.existsSync(utilsRootDir)) {
            console.log(`> Create directory ${utilsRootDir}`);
            fse.mkdirSync(utilsRootDir);
        }

        console.log(`> Copy binaries to ${utilsRootDir}`);
        fse.copySync(binDir, resolvePath(utilsRootDir + "/bin"), { recursive: true });
    } catch (error) {
        console.error(error);
    }
};

// From Shell
const argv = process.argv;
if (argv.length > 2 && argv.length < 6 && argv[4] === '--shell') {
    PrepareUtils(argv[2], argv[3]);
}
module.exports = PrepareUtils;