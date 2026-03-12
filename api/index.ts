import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

import { ValidationPipe, INestApplication } from '@nestjs/common';
import { Request, Response, Express } from 'express';
import cookieParser from 'cookie-parser';

let app: INestApplication;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);

    const api_url = process.env.API_URL;

    app.use(cookieParser());
    app.setGlobalPrefix(api_url || '/api/v1');

    app.useGlobalPipes(new ValidationPipe());
    app.enableCors();

    await app.init();
  }

  return app;
}

export default async function handler(req: Request, res: Response) {
  const appInstance = await bootstrap();

  const server = appInstance.getHttpAdapter().getInstance() as Express;

  server(req, res);
}
