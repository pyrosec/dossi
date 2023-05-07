'use strict';

import * as utils from "./utils";
import path from "path";
import child_process from "child_process";

export const stripUsed = (s) => {
  return s
    .split("\n")
    .filter((v) => v.match("[+]"))
    .join("\n");
};

export const holehe = async function holehe(username) {
  const subprocess = child_process.spawn(
    "holehe",
    [username, "--only-used", "--no-color"],
    { stdio: "pipe" }
  );
  const stdout = await new Promise((resolve, reject) => {
    let data = "";
    subprocess.stdout.setEncoding("utf8");
    subprocess.stdout.on("data", (v) => {
      data += v;
    });
    subprocess.on("exit", (code) => {
      if (code !== 0) return reject(Error("non-zero exit code"));
      resolve(data);
    });
  });
  return exports.stripUsed(stdout);
};
