export interface Package {
  _id: string;
  _rev: string;
  name: string;
  "dist-tags": DistTags;
  versions: { [key: string]: Version };
  time: { [key: string]: Date };
  bugs: Bugs;
  license: LicenseEnum;
  homepage: string;
  keywords: string[];
  repository: Repository;
  description: string;
  maintainers: Maintainer[];
  readme: string;
  readmeFilename: string;
  users: { [key: string]: boolean };
}

export interface Bugs {
  url: string;
}

export interface DistTags {
  latest: string;
  beta: string;
  experimental: string;
  rc: string;
  next: string;
  canary: string;
}

export type LicenseEnum = "BSD-3-Clause" | "MIT" | "Apache-2.0";

export interface Maintainer {
  name: string;
  email: string;
}

export interface Repository {
  url: string;
  type: string;
  directory?: string;
}

export interface Version {
  name: string;
  version: string;
  author?: Maintainer;
  _id: string;
  maintainers?: Maintainer[];
  bugs: Bugs;
  _npmUser: Maintainer;
  licenses?: LicenseElement[];
  repository: Repository;
  _npmVersion: string;
  description: string;
  directories: PhantomChildren;
  _nodeVersion?: string;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  peerDependencies?: { [key: string]: string };

  keywords?: string[];
  deprecated?: boolean | string;
  homepage?: string;
  license?: LicenseEnum;
  bundleDependencies?: boolean;
  gitHead?: string;
}

export interface PhantomChildren {}

export interface LicenseElement {
  url: string;
  type: LicenseEnum;
}

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: null;
  company: null;
  blog: string;
  location: null;
  email: null;
  hireable: null;
  bio: null;
  twitter_username: null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: Date;
  updated_at: Date;
}

export interface Metadata {
  _id: string;
  name: string;
  version: string;
  description: string;
  maintainers?: Maintainer[];
  repository: Repository;
  keywords?: string[];
  homepage?: string;
  deprecated?: boolean | string;
  license?: LicenseEnum;
  "dist-tags": DistTags;
  peerDependencies?: { [key: string]: string };
}
