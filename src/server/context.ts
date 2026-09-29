import type { Dictionary } from '../core/dictionary.js';
import type { MemoryStore } from '../core/memory/index.js';

export interface ServerContext {
  dictionary: Dictionary;
  memory: MemoryStore;
}
