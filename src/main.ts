import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { corsOptions } from './config/cors.options';
import { appConfig } from './config/app.config';
import { EnvConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: corsOptions });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Coletivo Gloma - API')
    .setDescription('Coletivo Gloma')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('Auth')
    .addTag('Shelter')
    .addTag('Hello World')
    .addTag('Distribution points')
    .addTag('Products')
    .addTag('Dashboard')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/document', app, document);
  appConfig(app);

  if (EnvConfig.ENV !== 'production') {
    await app.listen(8080);
  } else {
    await app.init();

    app.listen(8080, () => {
      console.log('Server is running on http://localhost:8080');
    });

    app.enableCors(corsOptions);
  }
}

bootstrap();
