import { resolve, sep } from 'path';
import getDebugger from 'debug';
import isExe from 'isexe';

export type WhichOptions = Partial<{
  paths: string[];
  exeExt: string[];
}>;

export const isWindows =
  process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';

export const colon = isWindows ? ';' : ':';

const debug = getDebugger('which');

function splitPath(path: string): string[] {
  return path.split(colon);
}

function getPaths(opts?: WhichOptions): string[] {
  return [...(isWindows ? [process.cwd()] : []), ...(opts?.paths || []), ...splitPath(process.env.PATH ?? '')];
}

function getExeExts(opts?: WhichOptions): string[] {
  return [...(isWindows ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';') : []), ...(opts?.exeExt ?? [])];
}

function getCmdWithExts(cmd: string, exts: string[]): string[] {
  return exts.map((ext) => cmd + ext.toLowerCase());
}

function getIsExeOptions(pathExts: string[]): Partial<isExe.Options> {
  return {
    ignoreErrors: true,
    pathExt: pathExts.join(';'),
  };
}

export async function which(cmd: string, opts: WhichOptions = {}): Promise<string | null> {
  const paths = getPaths(opts);
  const exeExts = getExeExts(opts);
  const exeOpts = getIsExeOptions(exeExts);
  debug(`cmd=${cmd}, paths=${paths}, exeExts=${exeExts}`);

  if (cmd.includes(sep)) {
    debug('got relative/absolute path');
    const path = resolve(cmd);
    return (await isExe(path, exeOpts)) ? path : null;
  }

  async function step(path?: string): Promise<string | null> {
    if (!path) return null;
    const file = resolve(path, cmd);
    debug(`checking ${file}`);
    if (await isExe(file, exeOpts)) {
      return file;
    }

    const cmdWithExts = getCmdWithExts(cmd, exeExts);
    if (isWindows || opts?.exeExt?.length) {
      const match = await subStep(cmdWithExts.shift());
      if (match) {
        return match;
      }
    }

    async function subStep(pathWithExt?: string): Promise<string | null> {
      if (!pathWithExt) return null;
      debug(`- checking ${pathWithExt}`);
      if (await isExe(pathWithExt, exeOpts)) {
        return pathWithExt;
      }

      return subStep(cmdWithExts.shift());
    }

    return step(paths.shift());
  }

  debug(`${cmd} not found`);
  return step(paths.shift());
}

export function whichSync(cmd: string, opts: WhichOptions = {}): string | null {
  const paths = getPaths(opts);
  const exeExts = getExeExts(opts);
  const exeOpts = getIsExeOptions(exeExts);
  debug(`cmd=${cmd}, paths=${paths}, exeExts=${exeExts}`);

  if (cmd.includes(sep)) {
    debug('got relative/absolute path');
    const path = resolve(cmd);
    return isExe.sync(path, exeOpts) ? path : null;
  }

  for (const path of paths) {
    const file = resolve(path, cmd);
    debug(`checking ${file}`);
    if (isExe.sync(file, exeOpts)) {
      return file;
    }

    if (isWindows || opts?.exeExt?.length) {
      for (const cmdWithExt of getCmdWithExts(file, exeExts)) {
        debug(`- checking ${cmdWithExt}`);
        if (isExe.sync(cmdWithExt, exeOpts)) {
          return cmdWithExt;
        }
      }
    }
  }

  debug(`${cmd} not found`);
  return null;
}

which.sync = whichSync;
export default which;
