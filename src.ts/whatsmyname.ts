'use strict';

import * as utils from "./utils";
import path from "path";
import child_process from "child_process";

export async function whatsmyname(username) {
  await utils.mkTmp();
  const dir = process.cwd();
  process.chdir(path.join(process.env.HOME, "WhatsMyName"));
  const subprocess = child_process.spawn(
    "python3",
    [
      path.join(
        process.env.HOME,
        "WhatsMyName",
        "web_accounts_list_checker.py"
      ),
      "-u",
      username,
      "-of",
      path.join(utils.tmpdir, username + ".json"),
    ],
    { stdio: "pipe" }
  );
  process.chdir(dir);
  const stdout = await new Promise((resolve, reject) => {
    let data = "";
    subprocess.on("exit", (code) => {
      if (code !== 0) return reject(Error("non-zero exit code"));
      resolve(utils.readResultRaw(username));
    });
  });
  return stdout;
};
