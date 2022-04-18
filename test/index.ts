import { chmodSync } from 'fs';
import { join } from 'path';
import { isWindows } from '../src';

export const script = 'echo foo\n';
export const getScriptPath = (part: string) => join(__dirname, `foobar.${part}.sh`);

export function makeExecutable(scriptPath: string) {
  if (!isWindows) {
    chmodSync(scriptPath, 0o755);
  }
}
