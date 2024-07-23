import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

export function IsDateStringBeforeNow(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isDateStringBeforeNow',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (typeof value !== 'string') {
            return false;
          }

          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return false;
          }

          const now = new Date();
          return date < now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ISO 8601 date string before the current time.`;
        },
      },
    });
  };
}