// Child process for the concurrency test: remembers `count` words with a prefix.
import { FileMemoryStore } from '../../src/core/memory/index.js';

const [path, prefix, count] = process.argv.slice(2);
const store = new FileMemoryStore(path!);
for (let i = 0; i < Number(count); i++) store.remember({ kind: 'word', say: `${prefix}-${i}` });
