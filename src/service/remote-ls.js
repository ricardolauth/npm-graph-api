var _ = require("lodash");
var async = require("async");
var semver = require("semver");
var request = require("request");
var once = require("once");
var npa = require("npm-package-arg");

// perform a recursive walk of a remote
// npm package and determine its dependency
// tree.
const registry = "https://registry.npmjs.org"; // URL of registry to ls.
const queue = async.queue(function (task, done) {
  _loadPackageJson(task, done);
}, 1024);
let tree = {};
const _loadPackageJson = (task, done) => {
  var name = task.name;
  // console.log("load", name);

  // account for scoped packages like @foo/bar
  var couchPackageName = name && npa(name).escapedName;

  // wrap done so it's only called once
  // if done throws in _walkDependencies, it will be called again in catch below
  // we want to avoid "Callback was already called." from async
  done = once(done);

  request.get(
    registry.replace(/\/$/, "") + "/" + couchPackageName,
    { json: true },
    function (err, res, obj) {
      if (err || res.statusCode < 200 || res.statusCode >= 400) {
        var message = res
          ? "status = " + res.statusCode
          : "error = " + err.message;
        console.log(
          "could not load " + name + "@" + task.version + " " + message
        );
        return done();
      }

      try {
        _walkDependencies(task, obj, done);
      } catch (e) {
        console.log(e.message);
        done();
      }
    }
  );
};

const _walkDependencies = (task, packageJson, done) => {
  var version = _guessVersion(task.version, packageJson);
  var dependencies = _.extend({}, packageJson.versions[version].dependencies);
  var fullName = packageJson.name + "@" + version;
  var parent = (task.parent[fullName] = {});

  Object.keys(dependencies).forEach(function (name) {
    queue.push({
      name: name,
      version: dependencies[name],
      parent: parent,
    });
  });

  done();
};

const _guessVersion = (versionString, packageJson) => {
  if (versionString === "latest") versionString = "*";

  var availableVersions = Object.keys(packageJson.versions);
  var version = semver.maxSatisfying(availableVersions, versionString, true);

  // check for prerelease-only versions
  if (
    !version &&
    versionString === "*" &&
    availableVersions.every(function (av) {
      return new semver.SemVer(av, true).prerelease.length;
    })
  ) {
    // just use latest then
    version = packageJson["dist-tags"] && packageJson["dist-tags"].latest;
  }

  if (!version)
    throw Error(
      "could not find a satisfactory version for string " + versionString
    );
  else return version;
};

const ls = (name, version) => {
  return new Promise((resolve) => {
    console.log("ls", name);
    queue.push({
      name: name,
      version: version,
      parent: tree,
    });

    queue.drain(() => {
      resolve(tree);
    });

    queue.resume();
  });
};

module.exports = ls;
