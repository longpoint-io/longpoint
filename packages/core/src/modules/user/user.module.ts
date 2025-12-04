import { Module } from '@nestjs/common';
import { UserRegistrationController } from './controllers/user-registration.controller';
import { UserController } from './controllers/user.controller';
import { UserRegistrationService } from './services/user-registration.service';
import { UserService } from './services/user.service';

@Module({
  controllers: [UserController, UserRegistrationController],
  providers: [UserService, UserRegistrationService],
})
export class UserModule {}
