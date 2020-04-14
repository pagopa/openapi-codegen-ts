/**
 * This module abstracts the start and stop of a Prism mock server (https://github.com/stoplightio/prism).
 *
 */

import { createLogger } from "@stoplight/prism-core";
import { getHttpOperationsFromResource } from "@stoplight/prism-http";
import { createServer } from "@stoplight/prism-http-server";

const servers = new Map<number, ReturnType<typeof createServer>>();

/**
 * Starts a mock server for a given specification
 * @param apiSpecUrl path to the OpenApi specification document
 * @param port port on which start the mock server
 *
 * @returns {Promise<void>} a resolving promise if the server is started correctly
 */
function startMockServer(apiSpecUrl: string, port: number = 4100) {
  const startedAt = Date.now();
  return getHttpOperationsFromResource(apiSpecUrl)
    .then(operations =>
      createServer(operations, {
        components: { logger: createLogger("test", { level: "silent" }) },
        config: {
          checkSecurity: true,
          validateRequest: true,
          validateResponse: true,
          errors: false,
          mock: { dynamic: false }
        },
        cors: true
      })
    )
    .then(server => {
      server.listen(port);
      console.log(
        `server started on port ${port} after ${Date.now() - startedAt}ms`
      );
      return server;
    })
    .then(server => servers.set(port, server));
}

/**
 * Stop all the servers previously started
 *
 * @returns {Promise<void>} a resolving promise if the servers have been stopped correctly
 */
function stopAllServers() {
  console.log(`stopping servers on ports ${[...servers.keys()].join(", ")}`);
  return Promise.all(
    [...servers.entries()].map(([port, server]) => {
      console.log("shutting down server on port", port);
      return server.close();
    })
  ).then(() => servers.clear());
}

export { startMockServer, stopAllServers };
