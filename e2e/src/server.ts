/**
 * NOTE ON IMPLEMENTATION
 * This module abstracts the start and stop of a Prism mock server (https://github.com/stoplightio/prism).
 * Such mechanism should be implemented programmatically by importing Prism's needed modules, however this is not possible at the moment due to some flaws in Prism's dependency management. Please refer to the following threads for more info:
 * https://github.com/stoplightio/prism/issues/1070
 * https://github.com/balanza/didactic-waffle/pull/1
 * https://github.com/stoplightio/prism/pull/1072
 *
 * As for now, I implemented the feature by executing npx on separate processes. This is suboptimal in terms of resource consumption and execution time, and should be avoided as soon as Prims solves its issues.
 *
 * As soon as we can, we should refactor this module to call Prism as a module, ideally keeping this module public interface.
 */

import { ChildProcess, spawn } from "child_process";

const servers = new Map<number, ChildProcess>();

function startMockServer(apiSpecUrl: string, port: number = 4100) {
  const [cmd, ...args] = [
    "npx",
    "-p",
    "@stoplight/prism-cli",
    "prism",
    "mock",
    apiSpecUrl,
    "--port",
    `${port}`
  ];

  console.log(`executing ${cmd} ${args.join(" ")}`);
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd: process.cwd(),
      detached: true
    });

    proc.stdout.on("data", chunk => {
      // wait for the server to be effectively listening
      if (~chunk.toString().indexOf("listening on")) {
        servers.set(port, proc);
        console.log(`server started on port ${port} after ${Date.now() - startedAt}ms`);
        resolve();
      }
    });
    proc.on("error", e => {
      reject(e);
    });
  });
}

function stopAllServers() {
  console.log(`stopping servers on ports ${[...servers.keys()].join(", ")}`);
  return Promise.all(
    [...servers.values()].map(
      (proc: ChildProcess) =>
        new Promise((resolve, reject) => {
          try {
            console.log("killing child process", proc.pid);
            proc.on("close", () => resolve());
            process.kill(-proc.pid);
          } catch (error) {
            reject(error);
          }
        })
    )
  ).then(() => servers.clear());
}

export { startMockServer, stopAllServers };
