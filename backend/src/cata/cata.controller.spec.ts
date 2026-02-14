import { Test, TestingModule } from '@nestjs/testing';
import { CataController } from './cata.controller';

describe('CataController', () => {
  let controller: CataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CataController],
    }).compile();

    controller = module.get<CataController>(CataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
