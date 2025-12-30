import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { CommonModule } from '../common/common.module';
import { ConfigService } from '../common/services';
import { LoggerService } from './logger.service';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [CommonModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          pinoHttp: {
            customProps: () => ({
              context: 'HTTP',
            }),
            level: configService.get('server.logLevel'),
            messageKey:
              configService.get('server.nodeEnv') === 'development'
                ? 'msg'
                : 'message',
            formatters: {
              level: (label, number) => {
                return {
                  severity: label.toUpperCase(),
                  level: number,
                };
              },
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'res.headers["set-cookie"]',
                'req.remoteAddress',
                'req.remotePort',
                'req.body.password',
                'req.body.token',
                'req.body.accessToken',
                'req.body.refreshToken',
              ],
              remove: true,
            },
            transport:
              configService.get('server.nodeEnv') === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                      singleLine: true,
                      ignore: 'pid,hostname',
                    },
                  }
                : undefined,
          },
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
