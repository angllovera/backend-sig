import { PartialType } from '@nestjs/mapped-types';
import { CreateDistribuidorDto } from './create-distribuidor.dto';

export class UpdateDistribuidorDto extends PartialType(CreateDistribuidorDto) {}
