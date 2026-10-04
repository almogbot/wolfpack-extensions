import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Deliberately small package-manager environment for local verification. */
export function isolatedPackageManagerEnv(root: string): Record<string, string> {
  const home = join(root, "home"), cache = join(root, "cache"), temp = join(root, "tmp"), config = join(root, "npmrc");
  for (const path of [home, cache, temp]) mkdirSync(path, { recursive: true, mode: 0o700 });
  writeFileSync(config, "ignore-scripts=true\nregistry=https://registry.npmjs.org/\n", { mode: 0o600 });
  return {
    PATH: process.env.PATH ?? "", HOME: home, TMPDIR: temp, XDG_CONFIG_HOME: join(home, ".config"), XDG_CACHE_HOME: cache,
    npm_config_userconfig: config, NPM_CONFIG_USERCONFIG: config, npm_config_cache: cache, NPM_CONFIG_CACHE: cache,
    npm_config_ignore_scripts: "true", NPM_CONFIG_IGNORE_SCRIPTS: "true", BUN_INSTALL_CACHE_DIR: join(cache, "bun"),
  };
}
