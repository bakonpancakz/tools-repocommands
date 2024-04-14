# tools-repocommands
Simple script I wrote to run console commands when pushes are done to a repository.


# `config.json` Schema
You can also reference your `config.json` location by setting the `CONFIG_LOCATION` environment variable. 

If your configuration is edited the application will automatically parse it.
Incase of an invalid Configuration it will be discarded and the previous one will be used.

```json
{
    "<username or organization>/<repository name>": {
        "secret": "<Your Secret>",
        "workDir": "<Directory to run commands in>",
        "commands": [
            "echo \"<Your Commands Here>\""
        ]
    },
    ...more entries
}
```

# Setup
1. Create GitHub Webhook for your repository (Push Events Only)
2. Create a secret
3. Create Config Entry
4. Open Port 8100 to Internet