const csv = require("csv-parser");
const fs = require("fs");
const _ = require("lodash");
const multi = require("multistream");
const commandLineArgs = require("command-line-args");
const optionDefinitions = [
  { name: "src", type: String, multiple: true, defaultOption: true },
  { name: "defaults", type: Boolean, multiple: false },
];
const options = commandLineArgs(optionDefinitions);
const path = require("path");
let provided = false;
let provided_count = 0;
try {
  provided = require("../scenarios.json");
  _.keys(provided).forEach((i) => {
    provided_count += provided[i].length;
  });
} catch {}

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
      if (options["defaults"] && provided) {
        let hash_prev = hash;
        hash = {};
        let total = 0;
        _.forEach(_.keys(hash_prev), (i) => {
          if (_.keys(provided).includes(i)) {
            const logged = hash_prev[i];
            const temp = _.map(provided[i], (i) => _.toString(i));
            const missed = _.difference(temp, logged);
            hash[i] = {
              logged: logged.length,
              missed: missed.length,
            };
            total += logged.length;
          }
        });
        hash["total"] = {
          logged: total,
          missed: provided_count - total,
        };
      } else {
        let total = 0;
        _.forEach(_.keys(hash), (i) => {
          const value = hash[i];
          hash[i] = {
            count: value.length,
            sequences: value.sort(),
          };
          total += value.length;
        });
        hash["total"] = total;
      }
      fs.writeFileSync("results.json", JSON.stringify(hash));
      clearInterval(loader);
      const pathName = path.join(__dirname, "../results.json");
      console.log(`File generated at - ${pathName}`);
    });
} else {
  console.log("Please provide a path for csv file to parse...");
}
