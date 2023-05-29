const fs = require("fs");
const _ = require("lodash");
let provided = false;
let provided_count = 0;
try {
  provided = require("../scenarios.json");
  _.keys(provided).forEach((i) => {
    provided_count += provided[i].length;
  });
} catch {}
const logged = require("../results.json");
let data = "Si No,Scenario Code,Sequence,Count\n";
let serial = 1;

_.forEach(logged, (value, key) => {
  if (key != "total") {
    list = _.sortBy(
      _.map(_.concat(value.sequences, value.missed_sequences), (i) =>
        _.toInteger(i)
      )
    );
    list = _.map(list, (i) => _.toString(i));
    _.forEach(list, (i) => {
      // if (_.includes(value.sequences, i)) {
      //   data += `${serial},${key},${i},Yes\n`;
      //   serial += 1;
      // } else {
      //   data += `${serial},${key},${i},\n`;
      //   serial += 1;
      // }
      data += `${serial},${key},${i},${value.count[i] || 0}\n`;
      serial += 1;
    });
  }
});

fs.writeFileSync("results.csv", data);
