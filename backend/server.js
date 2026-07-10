"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./src/app"));
const env_1 = __importDefault(require("./src/config/env"));
const db_1 = __importDefault(require("./src/config/db"));
const startServer = async () => {
    try {
        // Establish Database connection
        await (0, db_1.default)();
        const PORT = env_1.default.PORT || 5000;
        app_1.default.listen(PORT, () => {
            console.log(`🚀 FinVerse Server Booted on Port ${PORT} [${env_1.default.NODE_ENV}]`);
        });
    }
    catch (error) {
        console.error('❌ Server startup failure:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map