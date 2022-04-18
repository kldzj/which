## which

A [`which (1)`](https://linux.die.net/man/1/which)-like utility.

Returns the single first instance of the command executable that can be found, and null otherwise.

### Usage

```typescript
// async (promise)
import { which } from '@kldzj/which';

const ffmpegPath = await which('ffmpeg');

// sync (import as you prefer)
import { which, whichSync } from '@kldzj/which';

const nodePath = which.sync('node');
const samePath = whichSync('node');
```

### Options

```typescript
import { join } from 'path';
import { which } from '@kldzj/which';

const path = await which('executable', {
  // pass additional paths to search in
  paths: [join(__dirname, 'bin')],
  // pass additional extensions to search for
  exeExt: ['.xyz'],
});
```
