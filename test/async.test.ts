import { basename, dirname } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { script, getScriptPath, makeExecutable } from '.';
import { which } from '../src';

const scriptPath = getScriptPath('async');

beforeEach(() => {
  writeFileSync(scriptPath, script, 'utf8');
});

afterEach(() => {
  unlinkSync(scriptPath);
});

describe('async', () => {
  it('should find node', async () => {
    const node = await which('node');
    expect(typeof node).toBe('string');
  });

  it('should find when executable', async () => {
    makeExecutable(scriptPath);
    const foobar = await which(basename(scriptPath), { paths: [dirname(scriptPath)], exeExt: ['.SH'] });
    expect(typeof foobar).toBe('string');
  });

  it('should find when executable with absolute path', async () => {
    makeExecutable(scriptPath);
    const foobar = await which(scriptPath, { exeExt: ['.SH'] });
    expect(typeof foobar).toBe('string');
  });

  it('should not find when non-executable', async () => {
    const foobar = await which(basename(scriptPath), { paths: [dirname(scriptPath)], exeExt: ['.SH'] });
    expect(foobar).toBeNull();
  });
});
