import {
  Controller,
  Post as HttpPost,
  Get,
  Body,
  Param,
  UseGuards,
  Post,
  Req,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: RequestWithUser) {
    return this.postService.create(dto, req.user.userId);
  }

  @Post(':id/like')
  like(@Param('id') postId: string, @Req() req: RequestWithUser) {
    return this.postService.like(postId, req.user.userId);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.postService.findAll(req.user.userId);
  }
}
