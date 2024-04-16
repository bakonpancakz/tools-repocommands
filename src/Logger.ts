import { createWriteStream } from "fs";
import { inspect } from "util";

const _Output = createWriteStream("application.log", { flags: "a" })

function _Internal(severity_color: string, severity: string, service: string, message: string, data?: any) {
    const D = new Date().toISOString()
    process.stdout.write(`\x1b[90m${D} | ${severity_color}${severity} \x1b[90m@ \x1b[32m${service.padEnd(7, " ")} \x1b[90m- \x1b[0m${message}\n`)
    _Output.write(`${D} | ${severity} @ ${service} - ${message}\n`)
    if (data) {
        process.stdout.write(`${inspect(data, false, Infinity, true)}\n---\n`)
        _Output.write(`${inspect(data, false, Infinity, false)}\n---\n`)
    }
}

// Logs Information to the Console
export function Info(service: string, message: string, data?: any) {
    return _Internal("\x1b[34m", "INFO", service, message, data)
}

// Logs an Error to the Console
export function Error(service: string, message: string, data?: any) {
    return _Internal("\x1b[31m", "FAIL", service, message, data)
}