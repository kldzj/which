import isExe from 'isexe';
import { Suite } from 'benchmark';
import which, { whichAsync } from '../src';

new Suite('which')
  .add('sync', {
    fn: () => {
      which.sync('node');
    },
  })
  .add('async', {
    defer: true,
    fn: async (deferred: any) => {
      await which('node');
      deferred.resolve();
    },
  })
  .add('callback', {
    defer: true,
    fn: (deferred: any) => {
      whichAsync('node', {}, (err) => {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
    },
  })
  .add('isExe#sync', {
    fn: () => {
      isExe.sync('/usr/bin/mkfifo');
    },
  })
  .add('isExe#async', {
    defer: true,
    fn: async (deferred: any) => {
      await isExe('/usr/bin/mkfifo');
      deferred.resolve();
    },
  })
  .add('isExe#callback', {
    defer: true,
    fn: (deferred: any) => {
      isExe('/usr/bin/mkfifo', (err: any, result: any) => {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve();
        }
      });
    },
  })
  .on('cycle', function (event: any) {
    console.log(String(event.target));
  })
  .run({ async: false });
