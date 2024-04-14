import cluster from "cluster";
cluster.isPrimary
    ? require("./scripts/Primary")  // Run as Primary
    : require("./scripts/Worker");  // Run as Worker