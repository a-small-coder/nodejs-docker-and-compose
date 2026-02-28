import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { User } from '../users/entities/user.entity';

@Controller('wishlistlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  create(
    @Body() createWishlistDto: CreateWishlistDto,
    @Request() req: { user: User },
  ) {
    return this.wishlistsService.create({
      ...createWishlistDto,
      owner: { id: req.user.id } as User,
    } as CreateWishlistDto & { owner: Pick<User, 'id'> });
  }

  @Get()
  findAll() {
    return this.wishlistsService.find({});
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numId = +id;
    if (Number.isNaN(numId)) {
      throw new BadRequestException('Некорректный id');
    }
    return this.wishlistsService.findOne({ id: numId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
    @Request() req: { user: User },
  ) {
    const numId = +id;
    if (Number.isNaN(numId)) {
      throw new BadRequestException('Некорректный id');
    }
    return this.wishlistsService.updateWishlistIfAllowed(
      req.user.id,
      numId,
      updateWishlistDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: User }) {
    const numId = +id;
    if (Number.isNaN(numId)) {
      throw new BadRequestException('Некорректный id');
    }
    return this.wishlistsService.removeWishlistIfAllowed(req.user.id, numId);
  }
}
