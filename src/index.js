#!/usr/bin/env node

const git = require('simple-git');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist')
const parse = require('url-parse');
const lineByLine = require('n-readlines');
const Promise = require('promise');



clear();
console.log(
  chalk.green(
    figlet.textSync('Gitparser', { horizontalLayout: 'full' })
  )
);
console.log('\n');
//console.log(path.basename(process.cwd()));


var argv = minimist(process.argv.slice(2));
const usage = function() {

  const usageText = `
Usage:
  gitparser <command> [options]

Commands:
  help                     print usage

General Options:
  --repos <path>           default: repos.json - path to the repos file, one repo URL per line
  `
  console.log(chalk.white(usageText))
}


if (!argv['repos']) {
  usage();
  process.exit(1)
}

var filename = argv['repos'];
var reposList = new Array();
let line;
let lineNumber = 0;
const liner = new lineByLine(filename);

var contents = fs.readFileSync(filename);
var jsonContent = JSON.parse(contents);
var theJSON = {};
theJSON.report_run_time = "time";
theJSON.report_duration = "48";
theJSON.released = [];
theJSON.pending_review = [];

var pr_repo_count = 0;
var rr_repo_count = 0;

//JSON.stringify(theJSON);

var updateJSON = function(){

}
//=============================================
// should call repo processor 1 at a time
var x = 0;
function customAlert(jsonItem, callback) {
    processRepo(jsonItem.repo, jsonItem.branch, callback);
}

var loopArray = function(arr) {
    customAlert(arr[x], function(pendingJson){
        // set x to next item
        x++;


        theJSON.pending_review[pr_repo_count] = pendingJson;
		//theJSON.released[rr_repo_count] = releasedJson;
        pr_repo_count++;
		//rr_repo_count++;


        if(x == arr.length){
          //console.log(JSON.stringify(theJSON));
          writeJsonToFile(JSON.stringify(theJSON));
        }

        // any more items in array? continue loop
        if(x < arr.length) {
            loopArray(arr);
        }
    });


}
loopArray(jsonContent.repos);


//=============================================

function writeJsonToFile(json){
  fs.writeFile('commits.json', json, function (err) {
    console.log(chalk.blue('[Writing] commits to commits.json'));
    if (err) {
      return console.log(err)
    };
  });
}

function getRepoName(repoUrl, callback){
  var q = parse(repoUrl, true);
  callback(path.basename(q.pathname).replace(".git", ""));
}

function changeBranch(repoName, repoBranch, callback){
  console.log(chalk.blue('[Changing] branch for repo '+repoName+' to ['+repoBranch+']'));
  git(repoName).checkout(repoBranch, (err, update) =>{

    callback(repoName, repoBranch);
  });
}

// download repos
function downloadRepo(repoUrl, repoBranch, repoName){
  return new Promise(function(resolve, reject) {

      if (!fs.existsSync(repoName)) {
          //
          getRepoName(repoUrl, (repoPath) => {
            console.log(chalk.blue('[Downloading] '+repoUrl))
            git().clone(repoUrl, (err, update) =>{
                if(!err){
                  resolve(chalk.green('[Downloaded] '+repoUrl));
                }else{
                  reject(chalk.red('[Failed] '+err));
                }
              });
          });
          //
      }else{resolve(chalk.green('[Repo Exists] '+repoName));}

  });
}


function getLogPendingReviews(repoName, repoBranch, callback){
  console.log(chalk.magenta('[Downloading Pending Commits]'))
  var count = 0;
  var json = {}
  json.repository = repoName;
  json.branch = repoBranch;
  json.pending = [];
  var funcx = function(json){
    callback(json);
  };

  git(repoName).tags((err, update) =>{
    // if no tag then just all commits are pending review
    if(!update['latest']){
      git(repoName).log((err, update) => {
          json.pending = [];
          update['all'].forEach(element => {

              json.pending[count] = {};
              json.pending[count].message = element.message;
              json.pending[count].hash = element.hash;
              json.pending[count].timestamp = element.date;
              json.pending[count].author = element.author_name;
              count += 1;

          });
          funcx(json);
      });
    }else{
        git(repoName).tags((err, update) =>{
            var dict = {};
            dict[update['latest']+"..HEAD"] = null;

              git(repoName).log(dict, (err, update) =>{
                json.pending = [];
                update['all'].forEach(element => {

                    json.pending[count] = {};
                    json.pending[count].message = element.message;
                    json.pending[count].hash = element.hash;
                    json.pending[count].timestamp = element.date;
                    json.pending[count].author = element.author_name;
                    count += 1;
                });
                funcx(json);
              });
        });
    }

  });
}



function getLogReleased(repoName, repoBranch, callback){
  console.log(chalk.magenta('[Downloading Released Commits]'))
  var count = 0;
  var json = {}
  json.repository = repoName;
  json.branch = repoBranch;
  json.released = [];
  var funcx = function(json){
    callback(json);
  };

  git(repoName).tags((err, update) =>{
    if(update['latest']){
      var dict = {};
      dict[update['all'][update['all'].length-2]+".."+update['latest']] = null;
      //console.log(dict);
      //
      git(repoName).log((err, update) => {
          json.released = [];
          update['all'].forEach(element => {

              json.released[count] = {};
              json.released[count].message = element.message;
              json.released[count].hash = element.hash;
              json.released[count].timestamp = element.date;
              json.released[count].author = element.author_name;
              count += 1;
          });
          funcx(json);
      });
      //
    }
  });
}

// process repos
function processRepo(repoUrl, repoBranch, callback) {
  getRepoName(repoUrl, (repoName) => {
      // does repo already exist?
      var initializePromise;
      downloadRepoPromise = downloadRepo(repoUrl, repoBranch, repoName);
      downloadRepoPromise.then(function(result) {
        console.log(result);
        // get branch status
        git(repoName).status((err, update) => {

            if(!err){
                // fetch all the remote branch
                git(repoName).raw(['fetch','--all'], (err, result) => {
                  if(!err){
                    // change branch after fetch
                    changeBranch(repoName, repoBranch, (repoName, repoBranch) => {
                        git(repoName).pull('origin', repoBranch, (err, result) => {

                            getLogPendingReviews(repoName, repoBranch, (pjson)=>{
								callback(pjson);
                            });

							/*
							getLogReleased(repoName, repoBranch, (json)=>{

							});*/


                        });
                    });
                    //
                  }
                });
            }else{
                console.error(chalk.red('[Failed] ' + err));
                callback();
            }
          });
          //
      },function(err) {
        console.log(err);
        callback();
      });
  });
}
