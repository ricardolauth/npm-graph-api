import { Metadata, Package, Version } from "./types.js";
import axios from "axios";
// @ts-ignore
import { SemVer, maxSatisfying } from "semver";
import { distinctByKey, toMetadate } from "./utils.js";
//import PQueue from "p-queue";
// @ts-ignore
import queue from "async/queue";

//const queue = new Queue(64);

//const queue = new PQueue({ concurrency: 64 });

const registry = "https://registry.npmjs.org"; // URL of the registry to ls.

type Task = {
  name: string;
  version: string;
  parent: Record<string, object>;
  flat: Metadata[];
  depth: number;
};

const q = queue(function (task: Task, done: () => void) {
  _loadPackageJson(task, done);
}, 64);

const _loadPackageJson = async (task: Task, done: () => void) => {
  const { name, version } = task;
  const couchPackageName = name.replace("/", "%2f");

  try {
    const response = await axios.get(`${registry}/${couchPackageName}`);

    if (!response || response.status < 200 || response.status >= 400) {
      console.log(`Could not load ${name}@${version}`);
      return done();
    }

    _walkDependencies(task, response.data);
  } catch (err) {
    console.error(err);
    console.log(`Error loading ${name}@${version}: ${err}`);
  } finally {
    done();
  }
};

const _walkDependencies = (task: Task, packageJson: Package) => {
  //if (task.depth === 0) return;
  const version = _guessVersion(task.version, packageJson);
  const dependencies = { ...packageJson.versions[version].dependencies };
  const parent = (task.parent[packageJson.versions[version]._id] = {});

  task.flat.push(toMetadate(packageJson, version));
  const dependencyTasks = Object.keys(dependencies).map((depName) => ({
    ...task,
    name: depName,
    version: dependencies[depName],
    parent,
    depth: task.depth - 1,
  }));

  dependencyTasks.forEach((depTask) => q.push(depTask));
};

const _guessVersion = (versionString: string, packageJson: Package) => {
  if (versionString === "latest") versionString = "*";

  const availableVersions = Object.keys(packageJson.versions);
  let version = maxSatisfying(availableVersions, versionString, true);

  if (
    !version &&
    versionString === "*" &&
    availableVersions.every((av) => new SemVer(av, true).prerelease.length)
  ) {
    version = packageJson["dist-tags"]?.latest;
  }

  if (!version) {
    throw new Error(
      `Could not find a satisfactory version for ${versionString}`
    );
  }

  return version;
};

export const ls = async (
  name: string,
  version: string
): Promise<Record<string, object>> => {
  let tree = {};
  let flat: Metadata[] = [];
  const task: Task = {
    name,
    version,
    parent: tree,
    flat,
    depth: 7,
  };

  q.push(task);

  return new Promise((resolve, reject) => {
    q.drain(() => {
      resolve({ tree, flat: distinctByKey(flat, "_id") });
    });

    q.error((err: any) => reject(err));

    q.resume();
  });
};
