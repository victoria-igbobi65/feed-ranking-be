import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global ValidationPipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: true, // throws an error on unknown props
      transform: true, // transforms payloads to match DTO types
      transformOptions: {
        enableImplicitConversion: true, // enables automatic type conversion
      },
    }),
  );
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  console.log(`App running on http://localhost:${port}`);
}
bootstrap();
