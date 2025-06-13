import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class TaskProducer {
  constructor(@Inject('TASK_QUEUE') private readonly queue: Queue) {}

  /**
   * Queues a generic log message to the queue.
   * Useful for testing queue connectivity or logging async messages.
   *
   * @param message - Any string to log
   */
  async log(message: string): Promise<void> {
    await this.queue.add(
      'log',
      { message },
      {
        removeOnComplete: true,
        attempts: 1,
      },
    );
  }

  /**
   * Queues a simulated task to test job handling or worker behavior.
   * No payload is required; the worker can define what "work" means.
   */
  async simulateWork(): Promise<void> {
    await this.queue.add(
      'simulate-work',
      {},
      {
        removeOnComplete: true,
        attempts: 1,
      },
    );
  }

  /**
   * Queues a user activity (e.g., LIKE, COMMENT) to be logged.
   * This job is picked up by the worker to store activity records
   * and trigger updates like embedding recalculations.
   *
   * @param userId - The ID of the user performing the action
   * @param postId - The ID of the post involved
   * @param type - Type of activity (currently supports LIKE or COMMENT)
   */
  async logActivity(
    userId: string,
    postId: string,
    type: 'LIKE' | 'COMMENT',
  ): Promise<void> {
    await this.queue.add(
      'log-activity',
      { userId, postId, type },
      {
        removeOnComplete: true,
        attempts: 1,
      },
    );
  }

  /**
   * Queues a job to generate a semantic embedding for a post.
   * Embeddings are used for vector search and personalization.
   * Retries up to 3 times on failure with exponential backoff.
   *
   * @param postId - The ID of the post to generate embedding for
   */
  async queuePostEmbedding(postId: string): Promise<void> {
    await this.queue.add(
      'generate-embedding',
      { postId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );
  }

  /**
   * Queues a job to update the user's semantic vector profile.
   * This vector is computed from the embeddings of liked posts.
   * Uses a deterministic job ID to prevent multiple updates being queued simultaneously.
   *
   * @param userId - The ID of the user whose vector should be updated
   */
  async updateUserVector(userId: string): Promise<void> {
    await this.queue.add(
      'update-user-vector',
      { userId },
      {
        jobId: `update-vector-${userId}`, // ensures idempotency
        removeOnComplete: true,
      },
    );
  }
}
