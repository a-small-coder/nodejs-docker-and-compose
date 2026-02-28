import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { Request } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/public.decorator';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @Post()
  create(@Body() createWishDto: CreateWishDto, @Request() req: { user: User }) {
    return this.wishesService.create({
      ...createWishDto,
      owner: { id: req.user.id } as User,
    } as CreateWishDto & { owner: Pick<User, 'id'> });
  }

  @Public()
  @Get('top')
  getTop() {
    return this.wishesService.find({}, { order: { copied: 'DESC' }, take: 20 });
  }

  @Public()
  @Get('last')
  getLast() {
    return this.wishesService.find(
      {},
      { order: { createdAt: 'DESC' }, take: 40 },
    );
  }

  @Get()
  findAll() {
    return this.wishesService.find({});
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numId = +id;
    if (Number.isNaN(numId)) throw new BadRequestException('Некорректный id');
    const wish = await this.wishesService.findOneByIdForGiftPage(numId);
    if (!wish) throw new NotFoundException('Подарок не найден');
    return wish;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWishDto: UpdateWishDto,
    @Request() req: { user: User },
  ) {
    const numId = +id;
    if (Number.isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.wishesService.updateWishIfAllowed(
      req.user.id,
      numId,
      updateWishDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: User }) {
    const numId = +id;
    if (Number.isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.wishesService.removeWishIfAllowed(req.user.id, numId);
  }

  @Post(':id/copy')
  copyWish(@Param('id') id: string, @Request() req: { user: User }) {
    const numId = +id;
    if (Number.isNaN(numId)) throw new BadRequestException('Некорректный id');
    return this.wishesService.copyWish(req.user.id, numId);
  }
}
