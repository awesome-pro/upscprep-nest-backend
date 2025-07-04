import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  console.log('Frontend URL: ', process.env.FRONTEND_URL);
  console.log('Environment: ', process.env.NODE_ENV);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isProduction) {
        const allowedDomains = [
          'https://vercel.cynosnexus.com',
          'https://localhost:3000',
          'http://localhost:3000',
        ];

        if (!origin || allowedDomains.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        const devFrontendUrl = configService.get('FRONTEND_URL');
        if (!origin || origin === devFrontendUrl) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'apollo-require-preflight',
      'x-apollo-operation-name',
      'apollo-operation-name',
      'x-requested-with',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Credentials',
      'Cookie',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Bureau API')
    .setDescription('API for credit bureau services')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'Health and readiness check endpoints')
    .addTag('Common', 'Common API endpoints')
    .addTag('Logs', 'Log management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.use((req: any, res: any, next: () => void) => {
    const startTime = Date.now();
    console.log(`Incoming request: `, {
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`Response sent for: `, {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    });
    next();
  });

  await app.listen(8000, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:8000`);
}

bootstrap()
  .then(() => {
    console.log('Application started successfully');
  })
  .catch((error) => {
    console.error('Application failed to start', error);
    process.exit(1);
  });
