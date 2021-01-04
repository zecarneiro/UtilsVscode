#!/usr/bin/env bash
# José M. C. Noronha

declare __UTILS_ROOT_DIR__="utils"
declare __UTILS_DIR__=""

function binaries() {
    local binDir="bin"
    echo "> Copy binaries to ${__UTILS_ROOT_DIR__}"
    cp -r "$__UTILS_DIR__/$binDir" "${__UTILS_ROOT_DIR__}"

    echo "> Set permission on ${__UTILS_ROOT_DIR__}/$binDir"
    chmod -R 755 "${__UTILS_ROOT_DIR__}/$binDir"
}

function main() {
    local rootPath="$1"
    __UTILS_DIR__="$2"
    __UTILS_ROOT_DIR__="$rootPath/$__UTILS_ROOT_DIR__"

    echo "> Create directory $__UTILS_ROOT_DIR__"
    mkdir -p "$__UTILS_ROOT_DIR__"

    binaries
}
main "$@"
