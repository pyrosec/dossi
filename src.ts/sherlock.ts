'use strict';

import path from "path";
import child_process from "child_process";
import * as stream from "./stream";

export async function sherlock(username, onData = (v) => {}) {
  const subprocess = child_process.spawn(
    "python3",
    [
      path.join(process.env.HOME, "sherlock", "sherlock", "sherlock.py"),
      "--print-found",
      username,
    ],
    { stdio: "pipe" }
  );
  return await stream.streamStdout(subprocess, onData);
};
