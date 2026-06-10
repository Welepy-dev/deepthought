import { Test, TestingModule } from '@nestjs/testing';
import { FortyTwoService } from './fortytwo.service';

describe('FortyTwoService', () => {
  let service: FortyTwoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      /** Provider real é suficiente porque o teste apenas valida DI básica. */
      providers: [FortyTwoService],
    }).compile();

    /** Obtém a instância usando o nome exportado real do serviço. */
    service = module.get<FortyTwoService>(FortyTwoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
