export default function mockResponse(
  status: number,
  body?: any,
  headers?: any
) {
  return {
    status,
    json: async () => body,
    headers,
  };
}
