import { readFileSync } from 'node:fs';
import { assertLiveSnapshot } from '../src/utils/podcast-health.mjs';
assertLiveSnapshot(JSON.parse(readFileSync('dist/build-health.json', 'utf8')));
console.log('Live podcast snapshot verified; build is eligible for publishing.');
