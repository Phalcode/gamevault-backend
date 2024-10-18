import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

import { Media } from "../modules/media/media.entity";

@ValidatorConstraint({ async: false })
class MediaMimeTypeConstraint implements ValidatorConstraintInterface {
  validate(value: Media, args: ValidationArguments) {
    const [types] = args.constraints;
    if (!value || typeof value.type !== "string") {
      return false;
    }

    if (Array.isArray(types)) {
      return types.every((type) => value.type.startsWith(type));
    }

    return value.type.startsWith(types);
  }

  defaultMessage(args: ValidationArguments) {
    const [types] = args.constraints;
    return `Media type must start with ${Array.isArray(types) ? types.join(" or ") : types}`;
  }
}

export function MediaValidator(
  types: string | string[],
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [types],
      validator: MediaMimeTypeConstraint,
    });
  };
}
