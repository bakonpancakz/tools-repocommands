import * as fs from "fs";
import cluster from "cluster";

export let Config: Configuration
const ConfigLocation = process.env.CONFIG_LOCATION || "./config.json";
function ReadConfiguration(): Configuration | false {

    // Read Configuration
    let RawConfigData: Buffer;
    try {
        RawConfigData = fs.readFileSync(ConfigLocation);
    } catch (err) {
        console.error(`[CONFIG] Configuration Not Found:`, err);
        return false;
    }

    // Parse Configuration as JSON
    let RawConfigJSON: any;
    try {
        RawConfigJSON = JSON.parse(RawConfigData.toString());
    } catch (err) {
        console.error(`[CONFIG] Configuration is not JSON:`, err);
        return false;
    }

    // Parse Configuration
    let InvalidConfig = false;
    const NewConfig: Configuration = {}
    Object.entries(RawConfigJSON).forEach(([Name, Dict]: [string, any], index: number) => {

        // Validate Required Values
        if (!Dict.secret) return console.warn(`Dictionary '${Name}' is missing Field 'secret'`);
        if (!Dict.workDir) return console.warn(`Dictionary '${Name}' is missing Field 'workDir'`);
        if (!Dict.commands) return console.warn(`Dictionary '${Name}' is missing Field 'commands'`);

        // Validate Types
        if (!Array.isArray(Dict.commands)) return console.warn(`Dictionary '${Name}' Field 'commands' is not an 'Array'`);
        if (typeof (Dict.secret) !== "string") return console.warn(`Dictionary '${Name}' Field 'secret' is not a 'String'`);
        if (typeof (Dict.workDir) !== "string") return console.warn(`Dictionary '${Name}' Field 'workDir' is not a 'String'`);

        // Validate Commands Types
        const ValidCommands: string[] = [];
        Dict.commands.forEach((cmd: string, index: number) => {
            // Validate Command String
            if (typeof (cmd) !== "string") return console.warn(`Dictionary '${Name}' Field 'commands' at Index ${index} is not a 'String'`);
            // Add Valid Command
            ValidCommands.push(cmd);
        });

        // Store Commands Length
        if (Dict.commands.length !== ValidCommands.length) return InvalidConfig = true;
        Dict.commands = ValidCommands;

        // Add Config
        NewConfig[Name] = Dict;
    });

    // Invalid Configuration Detected?
    if (InvalidConfig) {
        console.debug("[CONFIG] Invalid Configuration, Ignoring...");
        return false
    };

    // Return Valid Config
    console.debug(`[CONFIG] Parsed Config for "${Object.keys(NewConfig).join(', "')}"`);
    return NewConfig;
};


// Initialize Configuration

const InitialConfig = ReadConfiguration();
Config = InitialConfig !== false ? InitialConfig : process.exit(1);
fs.watchFile(ConfigLocation, () => {
    console.warn("[CONFIG] Configuration was Updated...");
    const NewConfig = ReadConfiguration();
    if (NewConfig !== false) Config = NewConfig;
});


// Types
export interface Configuration {
    [key: string]: ConfigEntry;
}
export interface ConfigEntry {
    secret: string;
    workDir: string;
    commands: string[];
}