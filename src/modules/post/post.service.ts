import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostLike } from './entities/post-like/post-like';
import { CreatePostDto } from './dto/create-post.dto';
import { TaskProducer } from 'src/queue/producers/task.producer';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly taskProducer: TaskProducer,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new post authored by the given user.
   *
   * After saving the post, a background job is queued to generate a vector embedding
   * for semantic search and similarity matching.
   *
   * @param createPostDto - Object containing the post content
   * @param userId - ID of the user creating the post
   * @returns The saved Post object
   */
  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const newPost = this.postRepo.create({
      content: createPostDto.content,
      userId,
    });

    const savedPost = await this.postRepo.save(newPost);

    // Background job to generate vector embedding
    await this.taskProducer.queuePostEmbedding(savedPost.id);

    return savedPost;
  }


  /**
   * Allows a user to "like" a post.
   *
   * Uses a pessimistic write lock to avoid race conditions when multiple
   * users try to like the same post at the same time.
   *
   * If the user has already liked the post, an error is thrown.
   * The like count on the post is incremented, and the action is logged
   * in the background for analytics or notifications.
   *
   * @param postId - ID of the post to like
   * @param userId - ID of the user liking the post
   * @returns A message indicating success
   */
  async like(postId: string, userId: string): Promise<{ message: string }> {
    await this.dataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const likeRepo = manager.getRepository(PostLike);

      const post = await postRepo.findOne({
        where: { id: postId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!post) throw new NotFoundException('Post not found');

      const alreadyLiked = await likeRepo.findOne({
        where: { postId, userId },
      });

      if (alreadyLiked) {
        throw new BadRequestException('You already liked this post');
      }

      await likeRepo.save({ postId, userId });

      post.likes += 1;
      await postRepo.save(post);
    });

    // Log like activity outside the transaction
    await this.taskProducer.logActivity(userId, postId, 'LIKE');

    return { message: 'Post liked' };
  }

  /**
   * Retrieve a feed of posts tailored to the given user.
   *
   * If the user has a vector embedding in `user_vectors`, a similarity search is performed
   * using the pgvector `<#>` operator to return the 20 most relevant posts.
   *
   * If no embedding is found (e.g., new user), a fallback query returns
   * the 20 most recent posts across the platform.
   *
   * @param userId - ID of the user requesting posts
   * @returns An array of posts, either personalized or recent
   */
  async findAll(
    userId: string,
  ): Promise<{ id: string; content: string; createdAt: Date }[]> {
    const [userEmbedding] = await this.dataSource.query(
      `SELECT embedding FROM user_vectors WHERE "userId" = $1 LIMIT 1`,
      [userId],
    );

    if (userEmbedding?.embedding) {
      const similarPosts = await this.dataSource.query(
        `
        SELECT id, content, "createdAt"
        FROM post
        ORDER BY embedding <#> $1
        LIMIT 20
        `,
        [userEmbedding.embedding],
      );

      return similarPosts;
    }

    // If no embedding exists for user, return latest posts
    return await this.postRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
    });
  }
}
