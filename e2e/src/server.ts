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
 *
 * @param apiSpecUrl path to the OpenApi specification document
 * @param port port on which start the mock server
 *
 * @returns {Promise<void>} a resolving promise if the server is started correctly
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
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
          // eslint-disable-next-line sort-keys
          errors: false,
          mock: { dynamic: false }
        },
        cors: true
      })
    )
    .then(async server => {
      await server.listen(port);
      // eslint-disable-next-line no-console
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
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, prefer-arrow/prefer-arrow-functions
function stopAllServers() {
  // eslint-disable-next-line no-console
  console.log(`stopping servers on ports ${[...servers.keys()].join(", ")}`);
  return Promise.all(
    [...servers.entries()].map(([port, server]) => {
      // eslint-disable-next-line no-console
      console.log("shutting down server on port", port);
      return server.close();
    })
  ).then(() => servers.clear());
}

export { startMockServer, stopAllServers };
