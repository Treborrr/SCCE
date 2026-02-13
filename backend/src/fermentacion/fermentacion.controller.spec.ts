import { Test, TestingModule } from '@nestjs/testing';
import { FermentacionController } from './fermentacion.controller';

describe('FermentacionController', () => {
  let controller: FermentacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FermentacionController],
    }).compile();

    controller = module.get<FermentacionController>(FermentacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
