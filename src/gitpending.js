const git = require("simple-git");

module.exports = function(repoName, repoBranch, callback) {
  var count = 0;
  var json = {};
  json.repository = repoName;
  json.branch = repoBranch;
  json.pending = [];

  git(repoName).tags((err, update) => {
    // if no tag then just all commits are pending review
    if (!update["latest"]) {
      git(repoName).log((err, update) => {
        json.pending = [];
        update["all"].forEach(element => {
          json.pending[count] = {};
          json.pending[count].message = element.message;
          json.pending[count].hash = element.hash;
          json.pending[count].timestamp = element.date;
          json.pending[count].author = element.author_name;
          count += 1;
        });

        callback(json);
      });
    } else {
      git(repoName).tags((err, update) => {
        var dict = {};
        dict[update["latest"] + "..HEAD"] = null;
        git(repoName).log(dict, (err, update) => {
          json.pending = [];
          update["all"].forEach(element => {
            json.pending[count] = {};
            json.pending[count].message = element.message;
            json.pending[count].hash = element.hash;
            json.pending[count].timestamp = element.date;
            json.pending[count].author = element.author_name;
            count += 1;
          });
          callback(json);
        });
      });
    }
  });
};
