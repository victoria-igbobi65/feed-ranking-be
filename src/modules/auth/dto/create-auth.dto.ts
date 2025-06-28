import { IsEmail } from 'class-validator';
import { IsEmailDeliverable } from '../validators/is-email-deliverable.validator';

export class CreateAuthDto {
  @IsEmail({ require_tld: true }, { message: 'Invalid email address' })
  @IsEmailDeliverable({ message: 'Email domain is not valid or cannot receive mail' })
  email: string;
}
