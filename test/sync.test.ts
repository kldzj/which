import { basename, dirname } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { script, getScriptPath, makeExecutable } from '.';
import { whichSync } from '../src';

const scriptPath = getScriptPath('sync');

beforeEach(() => {
  writeFileSync(scriptPath, script, 'utf8');
});

afterEach(() => {
  unlinkSync(scriptPath);
});

describe('sync', () => {
  it('should find node', () => {
    const node = whichSync('node');
    expect(typeof node).toBe('string');
  });

  it('should find when executable', () => {
    makeExecutable(scriptPath);
    const foobar = whichSync(basename(scriptPath), { paths: [dirname(scriptPath)], exeExt: ['.SH'] });
    expect(typeof foobar).toBe('string');
  });

  it('should find when executable with absolute path', async () => {
    makeExecutable(scriptPath);
    const foobar = whichSync(scriptPath, { exeExt: ['.SH'] });
    expect(typeof foobar).toBe('string');
  });

  it('should not find when non-executable', () => {
    const foobar = whichSync(basename(scriptPath), { paths: [dirname(scriptPath)], exeExt: ['.SH'] });
    expect(foobar).toBeNull();
  });
});
