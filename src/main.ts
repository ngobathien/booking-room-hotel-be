import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  const api_url = process.env.API_URL;

  app.use(cookieParser());
  app.setGlobalPrefix(api_url || '/api/v1');

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  // await app.listen(port, () => {
  //   console.log(`Example app listening at http://localhost:${port}${api_url}/`);
  // });
  await app.listen(port);

  console.log(`Server running on port ${port}`);
}
bootstrap();
