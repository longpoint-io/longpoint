import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

@ApiSchema({ name: 'UpdateRole' })
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
