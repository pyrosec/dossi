'use strict';

import mkdirp from "mkdirp";
import tmpdir from "tmpdir";
import path from "path";
import fs from "fs-extra";

export { tmpdir }

export async function readResult(query) {
  const result = JSON.parse(
    (await fs.readFile(path.join(tmpdir, query + ".json"), "utf8")).trim()
  );
  return result;
};

export async function readResultRaw(query) {
  const result = (
    await fs.readFile(path.join(tmpdir, query + ".json"), "utf8")
  ).trim();
  return result;
};

export async function mkTmp() {
  await mkdirp(tmpdir);
};
