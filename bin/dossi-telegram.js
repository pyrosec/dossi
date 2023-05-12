#!/usr/bin/env node
'use strict';

const { run } = require('../lib/dossi');

(async () => {
  await run();
})().catch(console.error);
