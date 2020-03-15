const git = require("simple-git");
const datefuncs = require("./datefunc.js");

module.exports = function(repoName, repoBranch, callback) {
  var count_item = 0;
  var count_release = 0;
  var json = {};
  json.repository = repoName;
  json.branch = repoBranch;
  json.release = [];

  git(repoName).tags((err, update) => {
    if (update["latest"]) {
      var dict = {};
      var latest_tag = update["latest"];
      var previous_tag = update["all"][update["all"].length - 2];

      // if latest_tag-1 exist then use range (for repos with first tag)
      // or use just the latest_tag
      if (previous_tag) {
        dict[previous_tag + ".." + latest_tag] = null;
      } else {
        dict[latest_tag] = null;
      }

      //console.log(dict);
      json.release[count_release] = {};
      json.release[count_release].start = previous_tag;
      json.release[count_release].end = latest_tag;
      json.release[count_release].earliest = "";
      json.release[count_release].latest = "";
      json.release[count_release].item = [];

      git(repoName).log(dict, (err, update) => {
        for (el = 0; el < update["all"].length; el++) {
          var element = update["all"][el];

          //console.log(element);
          // get the earliest (start) date
          if (el == 0) {
            json.release[count_release].earliest = datefuncs.getISO(
              element.date
            );
          }

          // get the latest (end) date
          if (el == update["all"].length - 1) {
            json.release[count_release].latest = datefuncs.getISO(element.date);
          }

          json.release[count_release].item[count_item] = {};
          json.release[count_release].item[count_item].message =
            element.message;
          json.release[count_release].item[count_item].hash = element.hash;
          json.release[count_release].item[
            count_item
          ].timestamp = datefuncs.getISO(element.date);

          json.release[count_release].item[count_item].author =
            element.author_name;
          count_item += 1;
        }
        //
        callback(json);
      });
      //
    } else {
      callback(json);
    }
    //
  });
};
