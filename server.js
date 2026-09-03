"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const requiredEnvironment = ["DATABASE_URL", "JWT_SECRET"];
const missingEnvironment = requiredEnvironment.filter((key) => !process.env[key]);
if (missingEnvironment.length) {
    console.error("Missing required environment variable(s): " + missingEnvironment.join(", "));
    process.exit(1);
}
const PORT = parseInt(process.env.PORT || "4000", 10);
app_1.app.listen(PORT, () => {
    console.log("NexusFlow ERP API listening on port " + PORT);
});
