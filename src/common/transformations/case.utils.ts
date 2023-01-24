import { InternalServerErrorException } from '@nestjs/common/exceptions';

export const snakeToCamelCase = (text: string) => {
  if (typeof text !== 'string')
    throw new InternalServerErrorException('The value is not of type string');

  return text.replaceAll(/_[a-z]{1}/g, (match) =>
    match.split('').pop().toUpperCase(),
  );
};

export const camelToSnakeCase = (text: string) => {
  if (typeof text !== 'string')
    throw new InternalServerErrorException('The value is not of type string');

  return text.replaceAll(/[A-Z]/g, (match) => '_' + match.toLowerCase());
};
