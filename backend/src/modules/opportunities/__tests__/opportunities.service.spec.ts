import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OpportunitiesService } from '../opportunities.service';
import { Opportunity } from '../entities/opportunity.entity';

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        {
          provide: getRepositoryToken(Opportunity),
          useValue: {}, // mock repository
        },
      ],
    }).compile();

    service = module.get<OpportunitiesService>(OpportunitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
