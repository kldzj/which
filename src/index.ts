import { resolve, sep } from 'path';
import getDebugger from 'debug';
import isExe from 'isexe';
import { promisify } from 'util';

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
    return (await _isExe(path, exeOpts)) ? path : null;
  }

  async function step(path?: string): Promise<string | null> {
    if (!path) return null;
    const file = resolve(path, cmd);
    debug(`checking ${file}`);
    if (await _isExe(file, exeOpts)) {
      return file;
    }

    const cmdWithExts = getCmdWithExts(cmd, exeExts);
    if (isWindows || opts?.exeExt?.length) {
      const match = await subStep(cmdWithExts);
      if (match) {
        return match;
      }
    }

    return step(paths.shift());
  }

  async function subStep(cmdWithExts: string[]): Promise<string | null> {
    const pathWithExt = cmdWithExts.shift();
    if (!pathWithExt) return null;
    debug(`- checking ${pathWithExt}`);
    if (await _isExe(pathWithExt, exeOpts)) {
      return pathWithExt;
    }

    return subStep(cmdWithExts);
  }

  function _isExe(cmd: string, opts: Partial<isExe.Options> = {}) {
    return new Promise((resolve, reject) => {
      isExe(cmd, opts, (err, isexe) => {
        if (err) {
          reject(err);
        } else {
          resolve(isexe);
        }
      });
    });
  }

  debug(`${cmd} not found`);
  return step(paths.shift());
}

export function whichAsync(
  cmd: string,
  opts: WhichOptions = {},
  cb: (err: Error | null, path?: string | null) => void
): void {
  const paths = getPaths(opts);
  const exeExts = getExeExts(opts);
  const exeOpts = getIsExeOptions(exeExts);
  debug(`cmd=${cmd}, paths=${paths}, exeExts=${exeExts}`);

  if (cmd.includes(sep)) {
    debug('got relative/absolute path');
    const path = resolve(cmd);
    isExe(path, exeOpts, (err, isexe) => {
      if (err) {
        cb(err);
      } else if (isexe) {
        cb(null, path);
      } else {
        cb(null, null);
      }
    });
  } else {
    step(paths.shift(), cb);
  }

  function step(path: string | undefined, cb: (err: Error | null, path?: string | null) => void): void {
    if (!path) {
      cb(null, null);
      return;
    }

    const file = resolve(path, cmd);
    debug(`checking ${file}`);
    isExe(file, exeOpts, (err, isexe) => {
      if (err) {
        cb(err);
      } else if (isexe) {
        cb(null, file);
      } else {
        const cmdWithExts = getCmdWithExts(cmd, exeExts);
        if (isWindows || opts?.exeExt?.length) {
          subStep(cmdWithExts, (err, isexe) => {
            if (err) {
              cb(err);
            } else if (isexe) {
              cb(null, file);
            } else {
              step(paths.shift(), cb);
            }
          });
        } else {
          step(paths.shift(), cb);
        }
      }
    });
  }

  function subStep(cmdWithExts: string[], cb: (err: Error | null, path?: string | null) => void): void {
    const pathWithExt = cmdWithExts.shift();
    if (!pathWithExt) {
      cb(null, null);
      return;
    }

    debug(`- checking ${pathWithExt}`);
    isExe(pathWithExt, exeOpts, (err, isexe) => {
      if (err) {
        cb(err);
      } else if (isexe) {
        cb(null, pathWithExt);
      } else {
        subStep(cmdWithExts, cb);
      }
    });
  }
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
