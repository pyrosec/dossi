#!/usr/bin/env node
'use strict';

global.Olm = require('olm');

const { run } = require('../lib/dossi');

(async () => {
  await run();
})().catch(console.error);
