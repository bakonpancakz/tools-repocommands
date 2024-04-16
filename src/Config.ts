import { readFileSync, watchFile, existsSync } from "fs"
import { Info, Error } from "./Logger"

let ActiveConfig: Configuration = {}
const ConfigLocation = process.env.CONFIG_LOCATION || "./config.json"

interface Configuration {
    [key: string]: {
        secret: string
        steps: Array<{
            name: string
            workingDirectory: string
            commands: string[]
        }>
    }
}

(() => {
    // Intialize Configuration
    const InitialConfig = ReadConfiguration()
    if (!InitialConfig) {
        Error("CONFIG", "Initialization Failed. Exiting...")
        process.exit(1)
    }
    ActiveConfig = InitialConfig

    // Watch for Changes
    watchFile(ConfigLocation, () => {
        Info("CONFIG", "Configuration file was updated, refreshing...")
        const NewConfig = ReadConfiguration()
        if (NewConfig) ActiveConfig = NewConfig
    })
})()

// Reads Configuration from disk, returns false if failed.
function ReadConfiguration(): Configuration | false {

    // Read and Parse Data from Disk
    let RawConfigObject: any
    try {
        let RawConfigData = readFileSync(ConfigLocation)
        RawConfigObject = JSON.parse(RawConfigData.toString())
    } catch (err) {
        Error("CONFIG", "Cannot read/decode config", err)
        return false
    }

    // Parse Configuration
    const ConfigErrors = new Array<string>()
    const NewEntries: Configuration = {}
    Object.entries(RawConfigObject as Configuration).forEach(([key, value]) => {

        // Ensure Fields are Present
        if (value?.secret === undefined)
            return ConfigErrors.push(`${key}: Required Field`)
        if (typeof value.secret !== "string")
            return ConfigErrors.push(`${key}: Expected type of String`)
        if (value?.steps === undefined)
            return ConfigErrors.push(`${key}: Required Field`)
        if (!Array.isArray(value.steps))
            return ConfigErrors.push(`${key}: Expected type of Array`)

        // Validate Steps
        value.steps.forEach((step, i) => {
            if (step?.name === undefined)
                return ConfigErrors.push(`${key}[${i}]: Required Field`)
            if (typeof step.name !== "string")
                return ConfigErrors.push(`${key}[${i}]: Expected type of String`)

            if (step?.workingDirectory === undefined)
                return ConfigErrors.push(`${key}[${i}]: Required Field`)
            if (typeof step.workingDirectory !== "string")
                return ConfigErrors.push(`${key}[${i}]: Expected type of String`)
            if (!existsSync(step.workingDirectory))
                return ConfigErrors.push(`${key}[${i}]: Directory does not exist`)

            if (!step.commands === undefined)
                return ConfigErrors.push(`${key}[${i}]: Required Field`)
            if (!Array.isArray(step.commands))
                return ConfigErrors.push(`${key}[${i}]: Expected type of Array`)
            step.commands.every((e, ii) => {
                const X = typeof e === "string"
                if (!X) ConfigErrors.push(`${key}[${i}][${ii}]: Expected type of String`)
                return X
            })
        })

        // Add to Config
        Info("CONFIG", `Added ${key} to Config`)
        NewEntries[key] = value
    })

    // Return Results
    if (ConfigErrors.length) {
        Error("CONFIG", "Validation Errors", ConfigErrors)
        return false
    }

    return NewEntries
}

export default ActiveConfig