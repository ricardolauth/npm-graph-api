const workerpool = require("workerpool");
const ls = require("./remote-ls");

workerpool.worker({
  packageWorker: ls,
});
