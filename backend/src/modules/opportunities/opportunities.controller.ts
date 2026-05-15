import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';

/**
 * OpportunitiesController — stub for Step 01.
 * PATCH /v1/deals/{id}/status endpoint implemented in Step 08.
 */
@ApiTags('opportunities')
@Controller('deals')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}
}
