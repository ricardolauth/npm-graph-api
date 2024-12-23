import { Metadata, Package, Version } from "./types.js";
import axios, { AxiosResponse } from "axios";
// @ts-ignore
import { SemVer, maxSatisfying } from "semver";
import { distinctByKey, distinctFlat, toMetadate } from "./utils.js";
import npa from "npm-package-arg";
//import PQueue from "p-queue";
// @ts-ignore
import queue from "async/queue.js";

//const queue = new Queue(64);

//const queue = new PQueue({ concurrency: 64 });

const registry = "https://registry.npmjs.org"; // URL of the registry to ls.

type Task = {
  name: string;
  version: string;
  parentId?: string;
  nodes: Metadata[];
  edges: string[];
};

export function ls(
  name: string,
  version: string
): Promise<Record<string, object>> {
  const cache = new Map<string, AxiosResponse<any, any>>();
  const q = queue(function (task: Task, done: () => void) {
    _loadPackageJson(task, done);
  }, 32);

  q.pause();

  const _loadPackageJson = async (task: Task, done: () => void) => {
    const { name, version } = task;
    const couchPackageName = npa(name).escapedName!;

    try {
      let response = cache.get(couchPackageName);
      if (!response) {
        //console.log("loading", task.name, task.version);
        response = await axios.get(`${registry}/${couchPackageName}`);
        if (!response || response.status < 200 || response.status >= 400) {
          console.log(`Could not load ${name}@${version}`);
          return done();
        }

        cache.set(couchPackageName, response);
      } else {
        //console.log("cache hit", name, version);
      }

      _walkDependencies(task, response.data);
      done();
    } catch (err) {
      console.error(err);
      console.log(`Error loading ${name}@${version}: ${err}`);
      done();
    }
  };

  const _walkDependencies = (task: Task, packageJson: Package) => {
    const version = _guessVersion(task.version, packageJson);
    const dependencies = { ...packageJson.versions[version].dependencies };
    const id = `${packageJson.name}@${version}`;
    if (task.parentId) {
      const edge = `${task.parentId}->${id}`;
      task.edges.push(edge);
    }

    if (task.nodes.some((n) => n._id === id)) {
      return;
    }

    task.nodes.push(toMetadate(packageJson, version));
    const dependencyTasks = Object.keys(dependencies).map((depName) => ({
      ...task,
      name: depName,
      version: dependencies[depName],
      parentId: id,
    }));

    dependencyTasks.forEach((depTask) => q.push(depTask));
  };

  const _guessVersion = (versionString: string, packageJson: Package) => {
    if (versionString === "latest") versionString = "*";
    const idx = versionString.lastIndexOf("@");
    if (idx !== -1) {
      versionString = versionString.slice(idx + 1);
    }

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

  let edges: string[] = [];
  let nodes: Metadata[] = [];
  const task: Task = {
    name,
    version,
    nodes,
    edges,
  };

  q.push(task);

  return new Promise((resolve, reject) => {
    q.drain(() => {
      console.log("done");
      resolve({
        nodes,
        edges,
      });
    });

    q.error((err: any) => {
      console.log("error", err);
      reject(err);
    });

    // start working
    q.resume();
  });
}
