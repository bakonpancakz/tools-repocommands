# tools-repocommands
Simple Service to run console commands in order when pushes are made to a repo.

> This project is part of my [tools suite](https://github.com/stars/bakonpancakz/lists/tools).

- [tools-repocommands](#tools-repocommands)
  - [📄 Configuration](#-configuration)
  - [🌐 Example Response](#-example-response)
  - [📦 Setup](#-setup)

## 📄 Configuration
Make a `config.json` file at the root of the folder, you can also manually set a location by setting the `CONFIG_LOCATION` environment variable. 

- Config is automatically reloaded and validated when the file is edited
- You can also set your port with the `WEB_PORT` environment variable. The default port is [1273. (Rockefeller Street)](https://www.youtube.com/watch?v=Yt6PPkTDsWg)


```json
{
    "<username or organization>/<repository name>": {
        "secret": "<Your Secret>",
        "steps": [
            {
                "name": "Hello World!",
                "workingDirectory": "/path/to/app",
                "commands": [
                    "echo Hello World!"
                ]
            }
            ... more steps
        ]
    },
    ...more entries
}
```

## 🌐 Example Response
```json
{
    "repoName": "bakonpancakz/bakonpancakz",
    "steps": [{
        "success": false,
        "message": "Should Fail",
        "commands": [
            {
                "index": 0,
                "success": true,
                "time": 10,
                "output": "Should Pass"
            },
            {
                "index": 1,
                "success": true,
                "time": 20,
                "output": "Should Fail"
            }
            //There was a third command but 
            // it stops here because the second one failed
            // P.S. Time is in milliseconds
        ]
    }]
}
```

## 📦 Setup
1. Visit the Webhooks section in your Repository settings tab
2. Create a new webhook with the following options:
   - Trigger: `Just the push event` 
   - Secret: `<your secret>`
   - Type: `application/json`
   - URL: `http://<your public ip>:<your port>/git-push`
3. Expose your port to the internet
4. ???
5. Profit