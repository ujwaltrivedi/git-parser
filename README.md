# git-parser

## Install git-parser

```bash

npm install
npm link

gitparser --repos repos.json

# brew install jq
cat commits.json | jq

```

## Generate and Update SSH Keys to Git

- create `ssh-keygen` and upload public ssh keys to github
- add ssh private key to your environment `ssh-add ~/.ssh/private_github_key`

## File Format for `repos.json`

```json
{
  "repos": [
    {
      "repo": "git@github.com:ujwaltrivedi/git-parser.git",
      "branch": "master"
    },
    {
      "repo": "git@github.com:substack/minimist.git",
      "branch": "master"
    },
    {
      "repo": "https://github.com/redwoodjs/redwood.git",
      "branch": "master"
    }
  ]
}
```
