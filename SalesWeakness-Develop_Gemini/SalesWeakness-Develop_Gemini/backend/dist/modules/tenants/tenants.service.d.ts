import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
export declare class TenantsService {
    private readonly tenantsRepository;
    constructor(tenantsRepository: Repository<Tenant>);
}
