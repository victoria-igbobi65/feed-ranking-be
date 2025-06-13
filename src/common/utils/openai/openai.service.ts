import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
      organization: this.config.get<string>('OPENAI_ORG_ID'), // optional for most users
    });
  }

  /**
   * Generates a semantic embedding for a given input string using OpenAI's `text-embedding-3-small` model.
   *
   * Embeddings are high-dimensional vectors used for similarity search, clustering, and semantic reasoning.
   * 
   * @param input - The string content to embed (must not be empty)
   * @returns A promise resolving to a number[] vector of the embedding
   * @throws InternalServerErrorException if the OpenAI request fails
   */
  async embedText(input: string): Promise<number[]> {
    if (!input || input.trim() === '') {
      throw new InternalServerErrorException('Input text is required for embedding.');
    }

    try {
      const res = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });

      return res.data[0].embedding;
    } catch (error) {
      console.error('OpenAI Embedding Error:', error);
      throw new InternalServerErrorException('Failed to generate text embedding.');
    }
  }
}
