import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';

@ApiTags('opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}
}
