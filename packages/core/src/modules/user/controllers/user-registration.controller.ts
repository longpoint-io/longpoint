import { ApiSdkTag, Public, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CreateUserRegistrationDto, UserRegistrationDto } from '../dtos';
import { CreateUserRegistrationResponseDto } from '../dtos/registration/create-user-registration-response.dto';
import { UserRegistrationService } from '../services/user-registration.service';
import { ApiUserRegistrationNotFoundResponse } from '../user.errors';

@Controller('user-registrations')
@ApiSdkTag(SdkTag.Users)
export class UserRegistrationController {
  constructor(
    private readonly userRegistrationService: UserRegistrationService
  ) {}

  @Post()
  @RequirePermission(Permission.USERS_CREATE)
  @ApiOperation({
    summary: 'Create a user registration',
    description:
      'Creates a registration token that an external user can use to complete their signup.',
    operationId: 'createUserRegistration',
  })
  @ApiOkResponse({ type: CreateUserRegistrationResponseDto })
  @ApiBearerAuth()
  async createUserRegistration(@Body() body: CreateUserRegistrationDto) {
    const response = await this.userRegistrationService.createUserRegistration(
      body
    );
    return new CreateUserRegistrationResponseDto(response);
  }

  @Get()
  @RequirePermission(Permission.USERS_READ)
  @ApiOperation({
    summary: 'List user registrations',
    operationId: 'listUserRegistrations',
  })
  @ApiOkResponse({ type: [UserRegistrationDto] })
  @ApiBearerAuth()
  async listUserRegistrations() {
    const registrations =
      await this.userRegistrationService.listUserRegistrations();
    return registrations.map(
      (registration) => new UserRegistrationDto(registration)
    );
  }

  @Delete(':userRegistrationId')
  @RequirePermission(Permission.USERS_DELETE)
  @ApiOperation({
    summary: 'Revoke a user registration',
    description:
      'Invalidates the registration token, preventing a user from signing up with it.',
    operationId: 'revokeUserRegistration',
  })
  @ApiOkResponse({ description: 'The user registration was revoked' })
  @ApiUserRegistrationNotFoundResponse()
  @ApiBearerAuth()
  async revokeUserRegistration(
    @Param('userRegistrationId') userRegistrationId: string
  ) {
    await this.userRegistrationService.revokeUserRegistration(
      userRegistrationId
    );
  }

  @Get(':token')
  @ApiOperation({
    summary: 'Get a user registration',
    operationId: 'getUserRegistration',
  })
  @ApiOkResponse({ type: UserRegistrationDto })
  @ApiUserRegistrationNotFoundResponse()
  @Public()
  async getUserRegistration(@Param('token') token: string) {
    const userRegistration =
      await this.userRegistrationService.getUserRegistrationByTokenOrThrow(
        token
      );
    return new UserRegistrationDto(userRegistration);
  }
}
