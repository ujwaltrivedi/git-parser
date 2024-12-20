#!/usr/bin/env node

const version = "0.0.1";
const git = require("simple-git");
const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const minimist = require("minimist");
const parse = require("url-parse");
const lineByLine = require("n-readlines");
const Promise = require("promise");
const gitpending = require("./gitpending.js");
const gitreleased = require("./gitreleased.js");
const gitreleased_duration = require("./gitreleased_duration.js");
const datefuncs = require("./datefunc.js");
const currentTime = new Date();

console.log(
  chalk.green(figlet.textSync("Gitparser", { horizontalLayout: "full" }))
);
console.log("\n");
//console.log(path.basename(process.cwd()));

var argv = minimist(process.argv.slice(2), {
  "--": true,
  string: ["repos", "duration"],
  alias: { h: "help", v: "version" }
});
const usage = function() {
  const usageText = `
Usage: gitparser <command> [options]

Options:
  -h, --help				print usage
  -v, --version				get the version
  --repos <path>			default: repos.json, path to the repos file, one repo URL per line
  --duration				show released commits for last 48 hours. Must be multiple of 24
  `;
  console.log(chalk.white(usageText));
};

if (argv["version"]) {
  console.log(chalk.magenta("gitparser version:" + version));
  console.log("");
  process.exit(1);
}

if (argv["help"]) {
  usage();
  process.exit(1);
}

if (!argv["repos"]) {
  usage();
  process.exit(1);
}

var filename = argv["repos"];
var reposList = new Array();
let line;
let lineNumber = 0;

//check if repos.json exists
if (!fs.existsSync(filename)) {
  console.log(chalk.red("[File Not Found] " + filename));
  usage();
  process.exit(1);
}

//const liner = new lineByLine(filename);
var contents = fs.readFileSync(filename);
var jsonContent = JSON.parse(contents);
var duration = 0;
var theJSON = {};
theJSON.report_run_time = currentTime.toISOString();

// check for report duration argument
if (argv["duration"]) {
  if (argv["duration"] % 24) {
    console.log(
      chalk.red("[Incorrect Duration] Duration should be multiple of 24")
    );
    usage();
    process.exit(1);
  }
  theJSON.report_duration = argv["duration"];
  duration = argv["duration"];
}

theJSON.released = [];
theJSON.pending_review = [];
var pr_repo_count = 0;
var rr_repo_count = 0;

//JSON.stringify(theJSON);

var updateJSON = function() {};
//=============================================
// should call repo processor 1 at a time
var x = 0;
function customAlert(jsonItem, callback) {
  var repoName;
  getRepoName(jsonItem.repo, repoNameX => {
    repoName = repoNameX;
  });
  processRepoPromise = processRepo(jsonItem.repo, repoName, jsonItem.branch);
  processRepoPromise.then(
    function(result) {
      console.log(result);

      gitPendingPromise = getLogPendingReviews(repoName, jsonItem.branch);

      if (duration) {
        gitReleasedPromise = getLogReleasedReviewsDuration(
          repoName,
          jsonItem.branch,
          duration
        );
      } else {
        gitReleasedPromise = getLogReleasedReviews(repoName, jsonItem.branch);
      }

      Promise.all([
        Promise.resolve(gitPendingPromise),
        Promise.resolve(gitReleasedPromise)
      ]).then(function(values) {
        callback(values[0], values[1]);
      });
    },
    function(err) {
      console.log(err);
    }
  );
}

var loopArray = function(arr) {
  customAlert(arr[x], function(pendingJson, releasedJson) {
    // set x to next item
    x++;

    theJSON.pending_review[pr_repo_count] = pendingJson;
    theJSON.released[rr_repo_count] = releasedJson;
    pr_repo_count++;
    rr_repo_count++;

    if (x == arr.length) {
      writeJsonToFile(JSON.stringify(theJSON));
    }

    // any more items in array? continue loop
    if (x < arr.length) {
      loopArray(arr);
    }
  });
};

loopArray(jsonContent.repos);

//=============================================

function writeJsonToFile(json) {
  fs.writeFile("commits.json", json, function(err) {
    console.log(chalk.blue("[Writing] commits to commits.json"));
    if (err) {
      return console.log(err);
    }
  });
}

function getRepoName(repoUrl, callback) {
  var q = parse(repoUrl, true);
  callback(path.basename(q.pathname).replace(".git", ""));
}

function changeBranch(repoName, repoBranch, callback) {
  console.log(
    chalk.green(
      "[Changing] branch for repo " + repoName + " to [" + repoBranch + "]"
    )
  );
  git(repoName).checkout(repoBranch, (err, update) => {
    callback(repoName, repoBranch);
  });
}

// download repos
function downloadRepo(repoUrl, repoBranch, repoName) {
  return new Promise(function(resolve, reject) {
    if (!fs.existsSync(repoName)) {
      //
      getRepoName(repoUrl, repoPath => {
        console.log(chalk.blue("[Downloading] " + repoUrl));
        git().clone(repoUrl, (err, update) => {
          if (!err) {
            resolve(chalk.green("[Downloaded] " + repoUrl));
          } else {
            reject(chalk.red("[Failed] " + err));
          }
        });
      });
      //
    } else {
      resolve(chalk.green("[Repo Exists] " + repoName));
    }
  });
}

function getLogPendingReviews(repoName, repoBranch) {
  console.log(chalk.magenta("[Downloading Pending Commits]"));
  return new Promise(function(resolve, reject) {
    var funcx = function(json) {
      resolve(json);
    };
    gitpending(repoName, repoBranch, funcx);
  });
}

function getLogReleasedReviews(repoName, repoBranch) {
  console.log(chalk.magenta("[Downloading Released Commits]"));
  return new Promise(function(resolve, reject) {
    var funcx = function(json) {
      resolve(json);
    };
    gitreleased(repoName, repoBranch, funcx);
  });
}

function getLogReleasedReviewsDuration(repoName, repoBranch, duration) {
  console.log(
    chalk.magenta("[Downloading Last " + duration + " hrs of Commits]")
  );
  return new Promise(function(resolve, reject) {
    var funcx = function(json) {
      resolve(json);
    };
    gitreleased_duration(repoName, repoBranch, duration, funcx);
  });
}

// process repos
function processRepo(repoUrl, repoName, repoBranch) {
  return new Promise(function(resolve, reject) {
    // does repo already exist?
    downloadRepoPromise = downloadRepo(repoUrl, repoBranch, repoName);
    downloadRepoPromise.then(
      function(result) {
        console.log(result);
        // get branch status
        git(repoName).status((err, update) => {
          if (!err) {
            // fetch all the remote branch
            git(repoName).raw(["fetch", "--all"], (err, result) => {
              if (!err) {
                // change branch after fetch
                changeBranch(repoName, repoBranch, (repoName, repoBranch) => {
                  git(repoName).pull("origin", repoBranch, (err, result) => {
                    resolve(chalk.green("[Branch Switched] to " + repoBranch));
                  });
                }); //
              }
            });
          } else {
            reject(chalk.red("[Failed] " + err));
          }
        }); //
      },
      function(err) {
        reject(chalk.red("[Failed] " + err));
      }
    );
  });
}
