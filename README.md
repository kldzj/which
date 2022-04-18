## which

A `which`-like utility.

### Usage

```typescript
// async (promise)
import { which } from '@kldzj/which';

const ffmpegPath = await which('ffmpeg');

// sync
import { whichSync } from '@kldzj/which';

const nodePath = which.sync('node');
const samePath = whichSync('node');
```

### Options

```typescript
import { join } from 'path';
import { which } from '@kldzj/which';

const path = await which('executable', {
  // pass additional paths to search
  paths: [join(__dirname, 'bin')],
  // pass additional extensions to search
  exeExt: ['.xyz'],
});
```
