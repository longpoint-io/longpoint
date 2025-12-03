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
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateRoleDto, RoleDetailsDto, RoleDto, UpdateRoleDto } from './dtos';
import {
  ApiRoleAlreadyExistsResponse,
  ApiRoleNotFoundResponse,
} from './role.errors';
import { RoleService } from './role.service';

@Controller('roles')
@ApiSdkTag(SdkTag.Users)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermission(Permission.ROLE_CREATE)
  @ApiOperation({
    summary: 'Create a user role',
    operationId: 'createRole',
  })
  @ApiCreatedResponse({ type: RoleDetailsDto })
  @ApiRoleAlreadyExistsResponse()
  async createRole(@Body() body: CreateRoleDto) {
    const role = await this.roleService.createRole(body);
    return role.toDto('details');
  }

  @Get()
  @RequirePermission(Permission.ROLE_READ)
  @ApiOperation({
    summary: 'List available user roles',
    operationId: 'listRoles',
  })
  @ApiOkResponse({ type: [RoleDto] })
  async listRoles() {
    const roles = await this.roleService.listRoles();
    return roles.map((r) => r.toDto());
  }

  @Get(':id')
  @RequirePermission(Permission.ROLE_READ)
  @ApiOperation({
    summary: 'Get a user role',
    operationId: 'getRole',
  })
  @ApiOkResponse({ type: RoleDetailsDto })
  @ApiRoleNotFoundResponse()
  async getRole(@Param('id') id: string) {
    const role = await this.roleService.getRoleByIdOrThrow(id);
    return role.toDto('details');
  }

  @Patch(':id')
  @RequirePermission(Permission.ROLE_UPDATE)
  @ApiOperation({
    summary: 'Update a user role',
    operationId: 'updateRole',
  })
  @ApiOkResponse({ type: RoleDetailsDto })
  @ApiRoleNotFoundResponse()
  @ApiRoleAlreadyExistsResponse()
  async updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    const role = await this.roleService.getRoleByIdOrThrow(id);
    await role.update(body);
    return role.toDto('details');
  }

  @Delete(':id')
  @RequirePermission(Permission.ROLE_DELETE)
  @ApiOperation({
    summary: 'Delete a user role',
    operationId: 'deleteRole',
  })
  @ApiNoContentResponse()
  @ApiRoleNotFoundResponse()
  async deleteRole(@Param('id') id: string) {
    const role = await this.roleService.getRoleByIdOrThrow(id);
    await role.delete();
  }
}
