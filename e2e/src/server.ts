/* eslint-disable functional/immutable-data */
/**
 * This module abstracts the start and stop of a Prism mock server (https://github.com/stoplightio/prism).
 *
 */

import { once } from "events";
import { createServer as createServerWithHttp, Server } from "http";
import { createLogger } from "@stoplight/prism-core";
import { getHttpOperationsFromResource } from "@stoplight/prism-http";
import { createServer } from "@stoplight/prism-http-server";

const servers = new Map<number, ReturnType<typeof createServer>>();

const startServer = async (
  port: number,
  mockGetUserSession: jest.Mock
): Promise<Server> => {
  const server = createServerWithHttp((request, response) => {
    if (request.url?.startsWith("/test-parameter-with-body-ref")) {
      mockGetUserSession(request, response);
    } else {
      response.statusCode = 500;
      response.end();
    }
  }).listen(port);

  await once(server, "listening");

  return server;
};

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
      return server;
    })
    .then(server => servers.set(port, server));
}

const closeServer = (server: Server): Promise<void> =>
  new Promise(done => server.close(done)).then(_ => void 0);

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

export { startMockServer, stopAllServers, closeServer, startServer };
