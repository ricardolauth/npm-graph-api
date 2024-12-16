import { PackageJson } from "./types";
import workerpool from "workerpool";

const pool = workerpool.pool(__dirname + "/worker.js", {
  workerType: "thread",
});
const npm = require("npm-remote-ls");

npm.config({
  development: false,
  optional: false,
});

interface GetParams {
  name: string;
  version?: string;
}

export const getGraphForPackageName = ({
  name,
  version,
}: GetParams): Promise<Record<string, object>> => {
  console.log("loading", name, version);
  const promise = new Promise<Record<string, object>>((resolve, reject) => {
    try {
      npm.ls(
        name,
        version ?? "latest",
        false,
        function (obj: Record<string, object>) {
          resolve(obj);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
  return promise;
};

// export const getGraphForJson = async (json: PackageJson) => {
//   const data = await Promise.all(
//     Object.entries(json.dependencies ?? {}).map(([name, version]) =>
//       getGraphForPackageName({ name, version })
//     )
//   );

//   return Object.fromEntries(data.flatMap((d) => Object.entries(d)));
// };

export const getGraphForJson = async (json: PackageJson) => {
  //setInterval(() => console.log(pool.stats()), 1000);
  try {
    const data = await Promise.all(
      Object.entries(json.dependencies ?? {}).map(([name, version]) =>
        pool.exec("packageWorker", [{ name, version }])
      )
    );

    return Object.fromEntries(data.flatMap((d) => Object.entries(d)));
  } finally {
    pool.terminate();
  }
};
