import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { OpenAIService } from 'src/common/utils/openai/openai.service';
import { ActivityService } from 'src/modules/activity/activity.service';
import { Post } from 'src/modules/post/entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    private readonly activityService: ActivityService,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly openAIService: OpenAIService,
  ) {}

  /**
   * Handles background jobs dispatched via the task queue.
   * 
   * Supported job types:
   * - 'log-activity': Logs a user activity such as a 'LIKE'
   * - 'generate-embedding': Embeds a post's content using OpenAI and stores it
   * - 'update-user-vector': Recomputes a user's semantic preference vector
   *
   * @param job - The job payload provided by BullMQ
   */
  async handle(job: Job): Promise<void> {
    switch (job.name) {
      case 'log-activity':
        return this.logActivity(job.data);

      case 'generate-embedding':
        return this.generatePostEmbedding(job.data.postId);

      case 'update-user-vector':
        return this.activityService.updateUserVector(job.data.userId);

      default:
        this.logger.warn(`⚠️ Unhandled job: ${job.name}`);
    }
  }

  /**
   * Logs a user activity (e.g. LIKE) into the `activities` table.
   * Delegates to `ActivityService.logLike()`.
   *
   * @param data - An object with `userId`, `postId`, and `type`
   */
  private async logActivity(data: {
    userId: string;
    postId: string;
    type: string;
  }): Promise<void> {
    await this.activityService.logLike(data.userId, data.postId);

    this.logger.log(
      `📝 Logged activity (${data.type}) for user ${data.userId}`,
    );
  }


  /**
   * Uses OpenAI to generate a vector embedding for a post's content.
   * Saves the embedding back to the post record in the database.
   * 
   * This enables fast similarity search using pgvector.
   *
   * @param postId - The ID of the post to embed
   * @throws Will rethrow on failure so BullMQ can retry the job
   */
  private async generatePostEmbedding(postId: string): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      this.logger.warn(`⚠️ Post not found: ${postId}`);
      return;
    }

    try {
      const embedding = await this.openAIService.embedText(post.content);
      post.embedding = embedding;
      await this.postRepo.save(post);

      this.logger.log(`🧠 Saved OpenAI embedding for post ${post.id}`);
    } catch (err) {
      this.logger.error(`❌ Failed to embed post ${post.id}`, err);
      throw err;
    }
  }
}
