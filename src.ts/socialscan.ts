'use strict';

import * as utils from "./utils";
import child_process from "child_process";
import path from "path";

export const socialscan = async (username) => {
  await utils.mkTmp();
  const subprocess = child_process.spawn(
    "socialscan",
    ["--json", path.join(utils.tmpdir, username + ".json"), username],
    { stdio: "pipe" }
  );
  const stdout = await new Promise((resolve, reject) => {
    let data = "";
    subprocess.on("exit", (code) => {
      if (code !== 0) return reject(Error("non-zero exit code"));
      resolve(utils.readResult(username));
    });
  });
  return stdout;
}
