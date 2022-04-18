import { resolve, sep } from 'path';
import isExe from 'isexe';

export type WhichOptions = Partial<{
  paths: string[];
  exeExt: string[];
}>;

export const isWindows =
  process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';

function splitPath(path: string): string[] {
  return path.split(isWindows ? /[:;]/ : /:/);
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

  if (cmd.includes(sep)) {
    const path = resolve(cmd);
    return (await isExe(path, exeOpts)) ? path : null;
  }

  for (const path of paths) {
    const file = resolve(path, cmd);
    if (await isExe(file, exeOpts)) {
      return file;
    }

    if (isWindows || opts?.exeExt?.length) {
      for (const cmdWithExt of getCmdWithExts(file, exeExts)) {
        if (await isExe(cmdWithExt, exeOpts)) {
          return cmdWithExt;
        }
      }
    }
  }

  return null;
}

export function whichSync(cmd: string, opts: WhichOptions = {}): string | null {
  const paths = getPaths(opts);
  const exeExts = getExeExts(opts);
  const exeOpts = getIsExeOptions(exeExts);

  if (cmd.includes(sep)) {
    const path = resolve(cmd);
    return isExe.sync(path, exeOpts) ? path : null;
  }

  for (const path of paths) {
    const file = resolve(path, cmd);
    if (isExe.sync(file, exeOpts)) {
      return file;
    }

    if (isWindows || opts?.exeExt?.length) {
      for (const cmdWithExt of getCmdWithExts(file, exeExts)) {
        if (isExe.sync(cmdWithExt, exeOpts)) {
          return cmdWithExt;
        }
      }
    }
  }

  return null;
}

which.sync = whichSync;
export default which;
