import { Module } from '@nestjs/common';
import { FortyTwoService } from './fortytwo.service';

@Module({
  providers: [FortyTwoService],
  exports: [FortyTwoService],
})
export class FortyTwoModule {}
