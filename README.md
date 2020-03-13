# git-parser

## Install

```bash

npm install
npm link

gitparser --repos repos.json

# brew install jq
cat commits.json | jq

```

## repos.json format
```json
{
  "repos": [
    {
      "repo": "https://github.com/ujwaltrivedi/gitparser.git",
      "branch": "master"
    },
    {
      "repo": "https://github.com/substack/minimist.git",
      "branch": "master"
    },{
      "repo": "https://github.com/redwoodjs/redwood.git",
      "branch": "master"
    }
  ]
}
```
