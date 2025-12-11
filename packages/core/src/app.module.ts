import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  AuthModule,
  ClassifierModule,
  CollectionModule,
  CommonModule,
  FileDeliveryModule,
  LoggerModule,
  MediaModule,
  PluginModule,
  RoleModule,
  SearchModule,
  StorageModule,
  SystemModule,
  TransformModule,
  UploadModule,
  UserModule,
} from './modules';
import { AuthGuard, getStaticModule, HttpExceptionFilter } from './modules/app';
import { EventModule } from './modules/event';

@Module({
  imports: [
    // System modules
    getStaticModule(),
    CommonModule,
    LoggerModule,
    EventModule,
    PluginModule, // Must be before modules that depend on PluginRegistryService
    // Feature modules
    AuthModule,
    ClassifierModule,
    CollectionModule,
    FileDeliveryModule,
    MediaModule,
    RoleModule,
    SearchModule,
    SystemModule,
    StorageModule,
    TransformModule,
    UploadModule,
    UserModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
