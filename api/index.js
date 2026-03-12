"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
let app;
async function bootstrap() {
    if (!app) {
        app = await core_1.NestFactory.create(app_module_1.AppModule);
        const api_url = process.env.API_URL;
        app.use((0, cookie_parser_1.default)());
        app.setGlobalPrefix(api_url || '/api/v1');
        app.useGlobalPipes(new common_1.ValidationPipe());
        app.enableCors();
        await app.init();
    }
    return app;
}
async function handler(req, res) {
    const appInstance = await bootstrap();
    const server = appInstance.getHttpAdapter().getInstance();
    void server(req, res);
}
//# sourceMappingURL=index.js.map