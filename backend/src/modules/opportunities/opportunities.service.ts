import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity } from './entities/opportunity.entity';

/**
 * OpportunitiesService — stub for Step 01.
 * PATCH /v1/deals/{id}/status and stagnation worker logic in Step 05 & 08.
 */
@Injectable()
export class OpportunitiesService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunitiesRepository: Repository<Opportunity>,
  ) {}
}
