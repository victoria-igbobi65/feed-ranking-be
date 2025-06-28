import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import * as dns from 'dns/promises';

@ValidatorConstraint({ async: true })
export class IsEmailDeliverableConstraint implements ValidatorConstraintInterface {
  async validate(email: string) {
    const domain = email.split('@')[1];
    try {
      const records = await dns.resolveMx(domain);
      return records && records.length > 0;
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'Email domain is not deliverable';
  }
}

export function IsEmailDeliverable(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailDeliverableConstraint,
    });
  };
}
