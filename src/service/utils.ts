import { Metadata, Package } from "./types.js";

export const toMetadate = (pack: Package, versionStr: string): Metadata => {
  const {
    _id,
    description,
    name,
    version,
    repository,
    peerDependencies,
    license,
    homepage,
    deprecated,
    keywords,
  } = pack.versions[versionStr];

  return {
    _id,
    description,
    name,
    version,
    repository,
    peerDependencies,
    license,
    homepage,
    deprecated,
    keywords,
    "dist-tags": pack["dist-tags"],
    maintainers: pack.maintainers,
  };
};
