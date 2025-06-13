import { forwardRef, Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { UserVector } from '../user/entities/user-vector/user-vector';
import { BullModule } from 'src/queue/bull.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, UserVector]),
    forwardRef(() => BullModule),
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
