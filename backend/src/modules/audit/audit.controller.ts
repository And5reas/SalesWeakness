import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';

/**
 * AuditController — stub for Step 01.
 * GET /v1/funnel/audit endpoint implemented in Step 06.
 */
@ApiTags('audit')
@Controller('funnel')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
}
