exports.getISO = function(date) {
  var dateobj = new Date(date);
  return dateobj.toISOString();
};
