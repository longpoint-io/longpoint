import {
  Logger,
  RequestMethod,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import helmet from 'helmet';
import { LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ConfigService } from './modules/common/services';
import { LoggerService as LongpointLogger } from './modules/logger/logger.service';
import { InvalidInput } from './shared/errors';
import { SdkTag } from './shared/types/swagger.types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const port = configService.get('server.port');
  const nodeEnv = configService.get('server.nodeEnv');

  // ------------------------------------------------------------
  // Security headers
  // ------------------------------------------------------------
  app.use(
    helmet({
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Needed for Swagger UI
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for HLS streaming compatibility
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for HLS
      noSniff: true,
      hidePoweredBy: true,
      ieNoOpen: true,
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
    })
  );

  app.enableCors({
    origin: configService.get('server.corsOrigins'),
    credentials: true,
  });

  // ------------------------------------------------------------
  // Logger
  // ------------------------------------------------------------
  app.useLogger(app.get(LongpointLogger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // ------------------------------------------------------------
  // Pipes
  // ------------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const extractAllConstraintMessages = (
          validationErrors: ValidationError[]
        ): string[] => {
          return validationErrors.flatMap((error) => {
            const messages: string[] = [];

            if (error.constraints) {
              messages.push(...Object.values(error.constraints));
            }

            if (error.children && error.children.length > 0) {
              messages.push(...extractAllConstraintMessages(error.children));
            }

            return messages;
          });
        };
        const messages = extractAllConstraintMessages(errors);
        return new InvalidInput(messages);
      },
    })
  );

  // ------------------------------------------------------------
  // Swagger
  // ------------------------------------------------------------
  const docBuilder = new DocumentBuilder()
    .setTitle('Longpoint API')
    .setDescription('Programmatically manage longpoint resources.')
    .setVersion('1.0')
    .addBearerAuth();

  if (nodeEnv === 'development') {
    docBuilder.addServer(`http://localhost:${port}/api`);
  }

  for (const tag of Object.values(SdkTag)) {
    docBuilder.addTag(tag);
  }

  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, docBuilder.build(), {
      ignoreGlobalPrefix: true,
    })
  );

  // ------------------------------------------------------------
  // Miscellaneous setup
  // ------------------------------------------------------------
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: '/health', method: RequestMethod.GET },
      { path: '/v/*path', method: RequestMethod.GET },
    ],
  });
  app.use('/health', (req: express.Request, res: express.Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: nodeEnv,
    });
  });

  await app.listen(port);

  Logger.log(`Longpoint is running on: http://localhost:${port}`);
}

bootstrap();
