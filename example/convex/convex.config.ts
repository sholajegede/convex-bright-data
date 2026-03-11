import { defineApp } from "convex/server";
import brightDataSync from "../../src/component/convex.config.js";

const app = defineApp();
app.use(brightDataSync);

export default app;
