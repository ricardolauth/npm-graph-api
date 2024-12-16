import { Package } from "./types.js";
import axios from "axios";
// @ts-ignore
import { SemVer, maxSatisfying } from "semver";

//const queue = new PQueue({ concurrency: 1000 });

const registry = "https://registry.npmjs.org"; // URL of the registry to ls.

type Task = {
  name: string;
  version: string;
  parent: Record<string, object>;
  flat: Package[];
};

const _loadPackageJson = async (task: Task) => {
  const { name, version } = task;
  const couchPackageName = name.replace("/", "%2f");

  try {
    const response = await axios.get(`${registry}/${couchPackageName}`);

    if (!response || response.status < 200 || response.status >= 400) {
      console.log(`Could not load ${name}@${version}`);
      return;
    }

    await _walkDependencies(task, response.data);
  } catch (err) {
    console.error(err);
    console.log(`Error loading ${name}@${version}: ${err}`);
  }
};

const _walkDependencies = async (task: Task, packageJson: Package) => {
  const version = _guessVersion(task.version, packageJson);
  const dependencies = { ...packageJson.versions[version].dependencies }; // Spread instead of _.extend
  const fullName = `${packageJson.name}@${version}`;
  const parent = (task.parent[fullName] = {});

  task.flat.push(packageJson);
  const dependencyTasks = Object.keys(dependencies).map((depName) => ({
    ...task,
    name: depName,
    version: dependencies[depName],
    parent,
  }));

  // Process dependencies in parallel
  await Promise.all(
    dependencyTasks.map((depTask) => _loadPackageJson(depTask))
  );
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
  let flat: Package[] = [];
  const task = {
    name,
    version,
    parent: tree,
    flat,
  };

  await _loadPackageJson(task);
  return { tree, flat };
};
