import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}
}
