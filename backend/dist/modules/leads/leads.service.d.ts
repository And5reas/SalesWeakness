import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
export declare class LeadsService {
    private readonly leadsRepository;
    constructor(leadsRepository: Repository<Lead>);
}
