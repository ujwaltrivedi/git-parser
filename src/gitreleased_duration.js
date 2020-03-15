const git = require("simple-git");
const datefuncs = require("./datefunc.js");

module.exports = function(repoName, repoBranch, duration, callback) {
  var since = '--since="' + duration / 24 + ' days"';
  var json = {};
  json.repository = repoName;
  json.branch = repoBranch;
  json.release = [];

  git(repoName).tags((err, update) => {
    if (update["latest"]) {
      var dict = {};
      var latest_tag = update["latest"];
      var start_newtag = true;
      var count_item = 0;
      var count_release = 0;

      // if duration not 0 then we need since
      // else just get commits latest_tag-1 to latest_tag.
      dict[latest_tag] = null;
      dict[since] = null;

      //console.log(dict);
      // get commits by tag and time duration specified
      git(repoName).log(dict, (err, update) => {
        for (el = 0; el < update["all"].length; el++) {
          var previous_tag = "";
          var element = update["all"][el];
          var next_element;

          if (update["all"][el + 1]) {
            next_element = update["all"][el + 1];
          }
          //console.log(element);

          // get the earliest (start) date
          if (start_newtag) {
            start_newtag = false;
            count_item = 0;
            json.release[count_release] = {};
            json.release[count_release].item = [];
            json.release[count_release].end = latest_tag;
            element.refs = "notag";
            //console.log(latest_tag);
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

          // check if refs has 'tag:'
          if (next_element.refs.includes("tag:")) {
            // set the start tag
            //console.log(element.refs.split(":")[1].trim());
            start_newtag = true;
            var tagx = next_element.refs.split(":")[1].trim();
            latest_tag = tagx;
            json.release[count_release].start = tagx;
            json.release[count_release].earliest = datefuncs.getISO(
              element.date
            );

            count_release++;
          }
          //???
          // get the latest (end) date
          if (el == update["all"].length - 1) {
            json.release[count_release].earliest = datefuncs.getISO(
              element.date
            );
          }

          count_item++;
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
