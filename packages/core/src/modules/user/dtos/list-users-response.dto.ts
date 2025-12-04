import {
  type PaginationResponseArgs,
  PaginationResponseDto,
} from '@/shared/dtos';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { UserDto } from './user.dto';

@ApiSchema({ name: 'ListUsersResponse' })
export class ListUsersResponseDto extends PaginationResponseDto<UserDto> {
  @ApiProperty({
    description: 'The users in the response',
    type: [UserDto],
  })
  override items: UserDto[] = [];

  constructor(args: PaginationResponseArgs<UserDto>) {
    super(args);
    this.items = args.items;
  }
}
