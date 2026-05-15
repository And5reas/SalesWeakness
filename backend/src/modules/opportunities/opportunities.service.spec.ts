import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpportunitiesService } from './opportunities.service';
import { Opportunity } from './entities/opportunity.entity';

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  let repository: Repository<Opportunity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        {
          provide: getRepositoryToken(Opportunity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OpportunitiesService>(OpportunitiesService);
    repository = module.get<Repository<Opportunity>>(
      getRepositoryToken(Opportunity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have the opportunities repository injected', () => {
    expect(repository).toBeDefined();
  });
});
