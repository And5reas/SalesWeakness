import { Repository } from 'typeorm';
import { Opportunity } from './entities/opportunity.entity';
export declare class OpportunitiesService {
    private readonly opportunitiesRepository;
    constructor(opportunitiesRepository: Repository<Opportunity>);
}
