import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeadsService } from './leads.service';

/**
 * LeadsController — stub for Step 01.
 * POST /v1/leads/ingest endpoint implemented in Step 04.
 */
@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}
}
