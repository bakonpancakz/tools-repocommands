import { ConfigEntry } from "../util/ConfigParser";
import * as cp from "child_process";

(async () => {
    // Parse Configuration from Primary
    const StartTime = Date.now();
    const RepoName = process.env.REPO_NAME as string;
    const RepoConfig: ConfigEntry = JSON.parse(process.env.REPO_CONFIG as string);
    const CHeader = `[WORKER][${RepoName}]`;

    // Change Directory
    try {
        process.chdir(RepoConfig.workDir);
    } catch (err) {
        console.error(`${CHeader} Unable to change Directory:`, err);
        process.exit(1);
    }

    // Run Repo Commands
    RepoConfig.commands.forEach((command: string, index: number, arr: string[]) => {
        const Header = `${CHeader} Step ${index + 1} of ${arr.length}:`;
        console.log(`${Header} Running...`);
        
        // Start Commands
        try {
            const Results = cp.execSync(command);
            console.log(`${Header} Success!\x1b[2m${Results.toString()}\x1b[0m`);
        } catch (err) {
            // Command Failed...
            console.error(`${Header} Error\x1b[41m${err}\x1b[0m`);
            process.exit(1);
        }
    });

    // Process Completed!
    console.log(`${CHeader} Completed in ${(Date.now() - StartTime) / 1000} s`)
    process.exit(0);
})();