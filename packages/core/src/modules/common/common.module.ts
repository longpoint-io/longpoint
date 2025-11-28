import { Global, Module } from '@nestjs/common';
import {
  ConfigSchemaService,
  MediaProbeService,
} from './services';
import { ConfigService } from './services/config/config.service';
import { EncryptionService } from './services/encryption/encryption.service';
import { PrismaService } from './services/prisma/prisma.service';

const EXPORTS = [
  ConfigSchemaService,
  ConfigService,
  EncryptionService,
  PrismaService,
  MediaProbeService,
];

@Global()
@Module({
  imports: [],
  providers: [...EXPORTS],
  exports: EXPORTS,
})
export class CommonModule {}
