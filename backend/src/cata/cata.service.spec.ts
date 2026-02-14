import { Test, TestingModule } from '@nestjs/testing';
import { CataService } from './cata.service';

describe('CataService', () => {
  let service: CataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CataService],
    }).compile();

    service = module.get<CataService>(CataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
