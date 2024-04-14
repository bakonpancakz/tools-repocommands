import { Config } from "../util/ConfigParser";
import { createHmac } from "crypto";
import express from "express";
import cluster from "cluster";

// Create Express Server
const App = express();
App.get("/", (_, res) => res.json({ online: true }));
App.post("/git-push", express.json(), async (req: express.Request, res: express.Response) => {

    // Get Repository Name
    const RepoName = req.body?.repository?.full_name
    if (!RepoName) return res.status(404).end("No Commands for Signature");

    // Get Repository Config
    const RepoConfig = Config[RepoName];
    if (!RepoConfig) return res.status(404).end("No Configuration found for Repo");

    // Validate Secret
    const hmac = createHmac("sha256", RepoConfig.secret);
    hmac.update(JSON.stringify(req.body));

    // Check Signature Match
    if (("sha256=" + hmac.digest("hex")) !== req.header("X-Hub-Signature-256"))
        return res.status(500).end("Signatures didn't match!");

    // Run Command(s) for Repo
    console.log(`[WORKER][${RepoName}] Running Command(s)`);
    cluster.fork({
        REPO_NAME: RepoName,
        REPO_CONFIG: JSON.stringify(RepoConfig)
    });

    // Return OK
    res.end("OK");
});

// Start Express Server
App.listen(8100, () => console.log("[EXPRESS] Listening on port: 8100"));