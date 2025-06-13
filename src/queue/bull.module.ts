import { Module} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import { getRedisQConfig} from './bull.config';
import { TaskProcessor } from './processors/task.processor';
import { TaskProducer } from './producers/task.producer';
import { ActivityModule } from 'src/modules/activity/activity.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from 'src/modules/post/entities/post.entity';
import { OpenAIService } from 'src/common/utils/openai/openai.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [
    {
      provide: 'TASK_QUEUE',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Queue('task', {
          connection: getRedisQConfig(config),
        });
      },
    },
    {
      provide: 'TASK_WORKER',
      inject: [ConfigService, TaskProcessor],
      useFactory: (config: ConfigService, processor: TaskProcessor) => {
        return new Worker(
          'task',
          async job => processor.handle(job),
          {
            connection: getRedisQConfig(config),
            concurrency: 5,
          },
        );
      },
    },
    TaskProcessor,
    TaskProducer,
    OpenAIService,
  ],
  exports: ['TASK_QUEUE', TaskProducer],
  imports: [ActivityModule, TypeOrmModule.forFeature([Post]), HttpModule, ConfigModule]
})
export class BullModule {}
