import { ApiProperty, ApiSchema } from '@nestjs/swagger';

export type CreateUserRegistrationResponseParams = {
  token: string;
  registrationUrl: string;
};

@ApiSchema({ name: 'CreateUserRegistrationResponse' })
export class CreateUserRegistrationResponseDto {
  @ApiProperty({
    description: 'The token used to register the user',
    example: 'abcdefghijklmnopqrst',
  })
  token: string;

  @ApiProperty({
    description: 'The URL to register the user',
    example: 'https://longpoint.example.com/sign-up?token=abcdefghijklmnopqrst',
  })
  registrationUrl: string;

  constructor(params: CreateUserRegistrationResponseParams) {
    this.token = params.token;
    this.registrationUrl = params.registrationUrl;
  }
}
