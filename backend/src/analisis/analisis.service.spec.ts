import { Test, TestingModule } from '@nestjs/testing';
import { AnalisisService } from './analisis.service';

describe('AnalisisService', () => {
  let service: AnalisisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalisisService],
    }).compile();

    service = module.get<AnalisisService>(AnalisisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
