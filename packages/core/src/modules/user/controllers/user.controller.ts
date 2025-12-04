import { ApiSdkTag, RequirePermission } from '@/shared/decorators';
import { SdkTag } from '@/shared/types/swagger.types';
import { Permission } from '@longpoint/types';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ListUsersResponseDto, UpdateUserDto, UserDto } from '../dtos';
import { ListUsersQueryDto } from '../dtos/list-users-query.dto';
import { UserService } from '../services/user.service';
import { ApiUserNotFoundResponse } from '../user.errors';

@Controller('users')
@ApiSdkTag(SdkTag.Users)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @RequirePermission(Permission.USERS_READ)
  @ApiOperation({
    summary: 'List users',
    operationId: 'listUsers',
  })
  async listUsers(@Query() query: ListUsersQueryDto) {
    const users = await this.userService.listUsers(query);
    return new ListUsersResponseDto({
      items: users.map((user) => user.toDto()),
      path: '/users',
      query,
    });
  }

  @Get(':userId')
  @RequirePermission(Permission.USERS_READ)
  @ApiOperation({
    summary: 'Get a user',
    operationId: 'getUser',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiUserNotFoundResponse()
  async getUser(@Param('userId') userId: string) {
    const user = await this.userService.getUserByIdOrThrow(userId);
    return user.toDto();
  }

  @Patch(':userId')
  @RequirePermission(Permission.USERS_UPDATE)
  @ApiOperation({
    summary: 'Update a user',
    operationId: 'updateUser',
  })
  @ApiOkResponse({ type: UserDto })
  @ApiUserNotFoundResponse()
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: UpdateUserDto
  ) {
    const user = await this.userService.getUserByIdOrThrow(userId);
    await user.update(body);
    return user.toDto();
  }

  @Delete(':userId')
  @RequirePermission(Permission.USERS_DELETE)
  @ApiOperation({
    summary: 'Delete a user',
    operationId: 'deleteUser',
  })
  @ApiOkResponse({ description: 'The user was deleted' })
  @ApiUserNotFoundResponse()
  async deleteUser(@Param('userId') userId: string) {
    const user = await this.userService.getUserByIdOrThrow(userId);
    await user.delete();
  }
}
