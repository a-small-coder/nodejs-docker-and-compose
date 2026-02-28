import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ForbiddenException,
  BadRequestException,
  Delete,
  Patch,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Request } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  create(
    @Body() createOfferDto: CreateOfferDto,
    @Request() req: { user: User },
  ) {
    return this.offersService.createOfferWithChecks(
      req.user.id,
      createOfferDto,
    );
  }

  @Get()
  findAll() {
    return this.offersService.find({});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const numId = +id;
    if (Number.isNaN(numId)) {
      throw new BadRequestException('Некорректный id');
    }
    return this.offersService.findOne({ id: numId });
  }

  @Patch(':id')
  update() {
    throw new ForbiddenException('Редактирование заявок запрещено');
  }

  @Delete(':id')
  remove() {
    throw new ForbiddenException('Удаление заявок запрещено');
  }
}
