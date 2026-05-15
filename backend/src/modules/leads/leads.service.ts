import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

/**
 * LeadsService — stub for Step 01.
 * Full lead ingest logic (POST /v1/leads/ingest, deduplication) in Step 04.
 */
@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
  ) {}
}
