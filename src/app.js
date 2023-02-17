const csv = require("csv-parser");
const fs = require("fs");
const _ = require("lodash");
const commandLineArgs = require("command-line-args");
const optionDefinitions = [
  { name: "src", type: String, multiple: false, defaultOption: true },
];
const options = commandLineArgs(optionDefinitions);

var loader = null;
var flag = true;
function spinner() {
  if (flag) {
    flag = false;
    const P = ["\\", "|", "/", "-"];
    let x = 0;
    loader = setInterval(() => {
      process.stdout.write(`\r${P[x++]} Loading....`);
      x %= P.length;
    }, 250);
  }
}

let result = [];
if (options["src"]) {
  fs.createReadStream(options["src"])
    .pipe(csv())
    .on("data", (data) => {
      result.push(data["scenario_code"]);
      spinner();
    })
    .on("end", () => {
      clearInterval(loader);
      console.log();
      console.log();
      result = _.uniq(result);
      _.each({ AFU: 316, MAP: 136, ADD: 21 }, (v, k) => {
        console.log(k);
        console.log();
        let afu = _.filter(result, (i) => _.startsWith(i, k));
        afu = _.map(afu, (i) => _.toNumber(_.last(_.split(i, "-"))));
        afu = afu.sort();
        console.log(`Total Scenarios  - ${v}`);
        console.log(`Logged Scenarios - ${afu.length}`);
        console.log(`Missed Scenarios - ${v - afu.length}`);
        console.log();
        let logged = _.map(
          afu,
          (i) => `${k}-${i < 10 ? "0" + i.toString() : i.toString()}`
        );
        console.log(`Logged Scenarios - ${logged}`);
        console.log();
        let missed = _.filter(_.range(1, v + 1), (i) => !_.includes(afu, i));
        missed = _.map(
          missed,
          (i) => `${k}-${i < 10 ? "0" + i.toString() : i.toString()}`
        );
        console.log(`Missed Scenarios - ${missed}`);
        console.log();
      });
    });
} else {
  console.log("Please provide a path for csv file to parse...");
}
