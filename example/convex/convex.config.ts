import { defineApp } from "convex/server";
import brightDataSync from "@sholajegede/bright-data-sync/convex.config.js";

const app = defineApp();
app.use(brightDataSync);

export default app;
