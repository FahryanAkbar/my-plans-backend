import { Module } from '@nestjs/common';
import { DigitalTwinService } from './digital-twin.service';
import { DigitalTwinGateway } from './digital-twin.gateway';

@Module({
  providers: [DigitalTwinService, DigitalTwinGateway],
})
export class DigitalTwinModule {}
