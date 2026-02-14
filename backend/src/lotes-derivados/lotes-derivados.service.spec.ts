import { Test, TestingModule } from '@nestjs/testing';
import { LotesDerivadosService } from './lotes-derivados.service';

describe('LotesDerivadosService', () => {
  let service: LotesDerivadosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LotesDerivadosService],
    }).compile();

    service = module.get<LotesDerivadosService>(LotesDerivadosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
