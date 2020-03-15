# git-parser

## Install gitparser

- git clone <project url>
- `cd <project dir>`
- run `npm update` to install all dependencies
- run `npm link` to install `gitparser`
- run `gitparser --repos repos.json` to get commits in `commits.json` file
- run `gitparser --repos repos.json --duration 48` to get release commits for last 48 hours

## Generate and Update SSH Keys to Git

To download repos from any git hosting with public key authenticated follow below steps

- create `ssh-keygen` and upload public ssh keys to github
- add ssh private key to your environment `ssh-add ~/.ssh/private_github_key`

## File Format for `repos.json`

Example file format for repos.json file

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
