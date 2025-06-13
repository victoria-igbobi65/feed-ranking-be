import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { BullModule } from 'src/queue/bull.module';
import { PostLike } from './entities/post-like/post-like';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostLike]), BullModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
