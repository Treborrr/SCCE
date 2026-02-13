import { Test, TestingModule } from '@nestjs/testing';
import { FermentacionService } from './fermentacion.service';

describe('FermentacionService', () => {
  let service: FermentacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FermentacionService],
    }).compile();

    service = module.get<FermentacionService>(FermentacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
