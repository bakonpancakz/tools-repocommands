import * as cp from "child_process";
import { createHmac } from "crypto";
import express from "express";
import { Info, Error } from "./Logger";
import Config from "./Config";

let workingQueue = false
const WEB_PORT = parseInt(process.env.WEB_PORT || "1273")
const ServiceQueue = new Array<[string, express.Response]>()
const ResponseError = (res: express.Response, status: number, message: string) => res
    .status(status)
    .json({ success: false, message })


interface WorkResults {
    repoName: string;
    steps: Array<StepResults>;
}
interface StepResults {
    success: boolean;
    message: string;
    commands: Array<CommandResults>;
}
interface CommandResults {
    index: number;
    time: number;
    success: boolean;
    output: string;
}

function WorkOnNext() {
    if (workingQueue) return
    workingQueue = true

    // Fetch Item from Queue
    const item = ServiceQueue.pop()
    if (!item) return workingQueue = false

    const Steps = Config[item[0]]?.steps
    if (!Steps) return ResponseError(item[1], 404, "Missing Configuration for Repo")

    // Loop through all steps
    const WorkResults: WorkResults = { repoName: item[0], steps: [] }
    const StepsComplete = Steps.every(someStep => {
        const CommandResults = new Array<CommandResults>()

        // Attempt to Change Directory
        try {
            process.chdir(someStep.workingDirectory)
        } catch (err) {
            WorkResults.steps.push({
                success: true,
                commands: [],
                message: "Cannot Change Directory",
            })
            return false
        }

        // Run Commands Sequentially
        const CommandsCompleted = someStep.commands.every((command, index) => {
            const StartTime = Date.now()
            let output = "No Output"
            let success = false
            try {
                output = cp.execSync(command).toString().trim()
                success = true
            } catch (stderr) {
                output = String(stderr).trim()
                if (output.startsWith("Error: ")) output = output.slice(7)
            }
            CommandResults.push({
                index,
                success,
                time: (Date.now() - StartTime),
                output
            })
            return success
        })

        // Collect Results
        WorkResults.steps.push({
            success: CommandsCompleted,
            commands: CommandResults,
            message: CommandResults.find(e => !e.success)?.output || "OK"
        })
        return CommandsCompleted
    })

    // Return Results
    item[1].status(StepsComplete ? 200 : 500).json(WorkResults);
    (StepsComplete ? Info : Error)(item[0], "Results:", WorkResults)

    // Next please!
    workingQueue = false
    WorkOnNext()
}

express()
    .disable("etag")
    .disable("x-powered-by")
    .get("/", (_, r) => r.json({ online: true }))
    .post("/git-push", express.json(), async (req, res) => {

        // Fetch Repository Name
        const RepoName = req?.body?.repository?.full_name
        if (!RepoName) return ResponseError(res, 400, "Bad Request")

        // Get Repository Config
        const RepoConfig = Config[RepoName];
        if (!RepoConfig) return ResponseError(res, 404, "Missing Configuration for Repo")

        // Validate Signature
        const hmac = createHmac("sha256", RepoConfig.secret)
        hmac.update(JSON.stringify(req.body))
        if (`sha256=${hmac.digest("hex")}` !== req.header("X-Hub-Signature-256")) {
            Info("EXPRESS", `Invalid Signature sent in from ${req.ip}`, req.body)
            return ResponseError(res, 401, "Invalid Signature! Event Recorded.")
        }

        // Add Command(s) to the Queue
        Info(RepoName, "Added to the Queue")
        ServiceQueue.push([RepoName, res])
        WorkOnNext()
    })
    .listen(WEB_PORT, () => Info("EXPRESS", "Listening on port: " + WEB_PORT))