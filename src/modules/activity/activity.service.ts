import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Repository } from 'typeorm';
import { UserVector } from '../user/entities/user-vector/user-vector';
import { TaskProducer } from 'src/queue/producers/task.producer';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,

    @InjectRepository(UserVector)
    private readonly userVectorRepo: Repository<UserVector>,

    private readonly taskProducer: TaskProducer,
  ) {}

  /**
   * Logs a user's "LIKE" activity on a post.
   * 
   * - Creates an entry in the `activities` table.
   * - Triggers a background task to recalculate the user's embedding vector
   *   based on all the posts they’ve liked so far.
   *
   * @param userId - ID of the user performing the like
   * @param postId - ID of the post being liked
   */
  async logLike(userId: string, postId: string): Promise<void> {
    const activity = this.activityRepo.create({
      type: 'LIKE',
      userId,
      postId,
    });

    await this.activityRepo.save(activity);

    // Queue an async task to update the user's vector embedding
    await this.taskProducer.updateUserVector(userId);
  }
  

  /**
   * Updates the user's embedding vector based on all liked posts.
   * 
   * This method:
   * - Fetches all "LIKE" activities by the user.
   * - Extracts the embedding vectors of the liked posts.
   * - Computes the average vector across all liked post embeddings.
   * - Saves or updates the user's vector in the `user_vectors` table.
   *
   * If no embeddings are available (e.g., all liked posts are missing vectors), it does nothing.
   *
   * @param userId - ID of the user whose embedding vector should be updated
   */
  async updateUserVector(userId: string): Promise<void> {
    const activities = await this.activityRepo.find({
      where: { userId, type: 'LIKE' },
      relations: ['post'],
    });

    const vectors = activities
      .map((a) => a.post?.embedding)
      .filter((e) => Array.isArray(e));

    if (vectors.length === 0) return;

    const mean = this.averageVector(vectors);

    await this.userVectorRepo.save({
      userId,
      embedding: mean,
    });
  }


  /**
   * Computes the mean (average) of a list of vectors.
   * 
   * Each vector must have the same length. The result is a single vector
   * where each element is the average of the corresponding elements from all input vectors.
   *
   * Example:
   *   Input: [[1, 2], [3, 4]]
   *   Output: [2, 3]
   *
   * @param vectors - An array of number arrays (embeddings)
   * @returns The averaged vector
   */
  private averageVector(vectors: number[][]): number[] {
    const length = vectors[0].length;
    const sum = new Array(length).fill(0);

    for (const vec of vectors) {
      for (let i = 0; i < length; i++) {
        sum[i] += vec[i];
      }
    }

    return sum.map((val) =>
      parseFloat((val / vectors.length).toFixed(6)),
    );
  }
}
