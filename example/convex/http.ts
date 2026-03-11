import { httpRouter } from "convex/server";

const http = httpRouter();

// No HTTP routes needed for bright-data-sync.
// All interaction happens via Convex actions and queries.

export default http;