import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { ROUTES } from '@/shared/constants/routes.enum';
import { PAGINATION } from '@/shared/constants/pagination';
import { AuthUser } from '@/shared/decorators/auth-user.decorator';
import { User } from '@/entities/user.entity';

@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAccessTokenGuard)
@Controller(ROUTES.POSTS)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  create(@Body() createPostDto: CreatePostDto, @AuthUser() user: User) {
    return this.postService.createPost(createPostDto, user.id);
  }

  @Get()
  async findAll(
    @AuthUser() user: User,
    @Query('page', ParseIntPipe) page = PAGINATION.DEFAULT_PAGE,
    @Query('limit', ParseIntPipe) limit = PAGINATION.POST_DEFAULT_LIMIT,
  ) {
    return this.postService.getAllPosts(user.id, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @AuthUser() user: User) {
    return this.postService.getPostById(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @AuthUser() user: User,
  ) {
    return this.postService.updatePost(id, updatePostDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @AuthUser() user: User) {
    return this.postService.deletePost(id, user.id);
  }
}
