import { defineApp } from "convex/server";
import brightData from "../../src/component/convex.config.js";

const app = defineApp();
app.use(brightData);

export default app;