const csv = require("csv-parser");
const fs = require("fs");
const _ = require("lodash");
const multi = require("multistream");
const commandLineArgs = require("command-line-args");
const optionDefinitions = [
  { name: "src", type: String, multiple: true, defaultOption: true },
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
  const streams = _.map(options["src"], (i) => {
    return fs.createReadStream(i);
  });
  new multi(streams)
    .pipe(csv())
    .on("data", (data) => {
      result.push([data["scenario_code"], data["sequence"]]);
      spinner();
    })
    .on("end", () => {
      console.log();
      let hash = {};
      let value;
      _.forEach(result, (i) => {
        if (!_.includes(_.keys(hash), i[0])) {
          hash[i[0]] = [];
        }
        value = hash[i[0]];
        value = _.concat(value, i[1]);
        hash[i[0]] = _.uniq(value);
      });
      fs.writeFileSync(
        "./src/loggers_count.csv",
        `Scenario Code,Count,Sequences\n`
      );
      _.forEach(_.keys(hash), (i) => {
        try {
          fs.appendFileSync(
            "./src/loggers_count.csv",
            `"${i}",${hash[i].length},"${_.join(hash[i], ",")}"\n`
          );
        } catch (err) {
          console.error(err);
        }
      });
      clearInterval(loader);
      console.log(`File generated at - ${__dirname}/loggers_count.csv`);
    });
} else {
  console.log("Please provide a path for csv file to parse...");
}
