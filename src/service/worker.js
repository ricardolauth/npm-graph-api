const workerpool = require("workerpool");
const npm = require("npm-remote-ls");

npm.config({
  development: false,
  optional: false,
});

const getGraphForPackageName = ({ name, version }) => {
  const promise = new Promise((resolve, reject) => {
    try {
      npm.ls(name, version ?? "latest", false, function (obj) {
        resolve(obj);
      });
    } catch (err) {
      reject(err);
    }
  });
  return promise;
};

workerpool.worker({
  packageWorker: getGraphForPackageName,
});
