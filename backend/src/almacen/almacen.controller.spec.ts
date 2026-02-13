import { Test, TestingModule } from '@nestjs/testing';
import { AlmacenController } from './almacen.controller';

describe('AlmacenController', () => {
  let controller: AlmacenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlmacenController],
    }).compile();

    controller = module.get<AlmacenController>(AlmacenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
