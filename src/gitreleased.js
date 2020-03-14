const git = require("simple-git");
const datefuncs = require("./datefunc.js");

module.exports = function(repoName, repoBranch, callback) {
  var countItem = 0;
  var countRelease = 0;
  var json = {};
  json.repository = repoName;
  json.branch = repoBranch;
  json.release = [];
  var funcx = function(json) {
    callback(json);
  };

  git(repoName).tags((err, update) => {
    if (update["latest"]) {
      var dict = {};
      dict[
        update["all"][update["all"].length - 2] + ".." + update["latest"]
      ] = null;

      //dict['--since="2 days ago"'] = null;
      //console.log(dict);

      json.release[countRelease] = {};
      json.release[countRelease].start =
        update["all"][update["all"].length - 2];
      json.release[countRelease].end = update["latest"];
      json.release[countRelease].earliest = "";
      json.release[countRelease].latest = "";
      json.release[countRelease].item = [];

      git(repoName).log(dict, (err, update) => {
        //update["all"].forEach(element => {});
        for (el = 0; el < update["all"].length; el++) {
          var element = update["all"][el];
          if (el == 0) {
            json.release[countRelease].earliest = datefuncs.getISO(
              element.date
            );
          }

          if (el == update["all"].length - 1) {
            json.release[countRelease].latest = datefuncs.getISO(element.date);
          }

          json.release[countRelease].item[countItem] = {};
          json.release[countRelease].item[countItem].message = element.message;
          json.release[countRelease].item[countItem].hash = element.hash;

          json.release[countRelease].item[
            countItem
          ].timestamp = datefuncs.getISO(element.date);

          json.release[countRelease].item[countItem].author =
            element.author_name;
          countItem += 1;
        }

        callback(json);
      });
      //
    } else {
      callback(json);
    }
  });
};
