import {
    ValidationArguments,
    ValidationOptions,
    registerDecorator,
} from "class-validator";

export function IsDateStringBeforeNow(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "IsDateStringBeforeNow",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            return false;
          }

          const date = new Date(value);
          const now = new Date();

          return date < now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a date in the past`;
        },
      },
    });
  };
}
