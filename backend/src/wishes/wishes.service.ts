import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Wish } from './entities/wish.entity';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private wishesRepository: Repository<Wish>,
  ) {}

  create(createWishDto: CreateWishDto) {
    return this.wishesRepository.save(
      this.wishesRepository.create(createWishDto as Partial<Wish>),
    );
  }

  findOne(where: FindOptionsWhere<Wish>) {
    return this.wishesRepository.findOne({ where });
  }

  find(
    where: FindOptionsWhere<Wish>,
    options?: { order?: Record<string, 'ASC' | 'DESC'>; take?: number },
  ) {
    return this.wishesRepository.find({
      where,
      order: options?.order,
      take: options?.take,
    });
  }

  async findOneByIdForGiftPage(id: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id },
      relations: ['owner', 'offers', 'offers.user'],
    });
    if (!wish) return null;
    return {
      ...wish,
      owner: wish.owner
        ? { id: wish.owner.id, username: wish.owner.username }
        : undefined,
      offers: (wish.offers || []).map((offer) => ({
        name: offer.hidden ? 'Скрыто' : offer.user?.username ?? '',
        amount: Number(offer.amount),
        createdAt: offer.createdAt,
        img: offer.hidden ? undefined : offer.user?.avatar,
      })),
    };
  }

  async updateOne(where: FindOptionsWhere<Wish>, updateWishDto: UpdateWishDto) {
    await this.wishesRepository.update(where, updateWishDto as Partial<Wish>);
    return this.wishesRepository.findOne({ where });
  }

  removeOne(where: FindOptionsWhere<Wish>) {
    return this.wishesRepository.delete(where);
  }

  async updateWishIfAllowed(
    userId: number,
    wishId: number,
    updateWishDto: UpdateWishDto,
  ) {
    const wish = await this.wishesRepository.findOne({
      where: { id: wishId },
      relations: ['owner', 'offers'],
    });
    if (!wish) throw new NotFoundException('Подарок не найден');
    if (!wish.owner) {
      throw new NotFoundException('Владелец подарка не найден');
    }
    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Нельзя редактировать чужой подарок');
    }
    const hasOffers = Number(wish.raised) > 0;
    if (
      hasOffers &&
      updateWishDto.price !== undefined &&
      Number(updateWishDto.price) !== Number(wish.price)
    ) {
      throw new BadRequestException(
        'Нельзя менять стоимость, если уже есть заявки',
      );
    }
    const { raised: _raised, ...safeUpdate } =
      updateWishDto as UpdateWishDto & {
        raised?: number;
      };
    await this.wishesRepository.update(
      { id: wishId },
      safeUpdate as Partial<Wish>,
    );
    return this.wishesRepository.findOne({ where: { id: wishId } });
  }

  async removeWishIfAllowed(userId: number, wishId: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id: wishId },
      relations: ['owner'],
    });
    if (!wish) throw new NotFoundException('Подарок не найден');
    if (!wish.owner) {
      throw new NotFoundException('Владелец подарка не найден');
    }
    if (wish.owner.id !== userId) {
      throw new ForbiddenException('Нельзя удалять чужой подарок');
    }
    return this.wishesRepository.delete({ id: wishId });
  }

  async copyWish(userId: number, wishId: number) {
    const wish = await this.wishesRepository.findOne({
      where: { id: wishId },
      relations: ['owner'],
    });
    if (!wish) throw new NotFoundException('Подарок не найден');
    if (!wish.owner) {
      throw new NotFoundException('Владелец подарка не найден');
    }
    if (wish.owner.id === userId) {
      throw new BadRequestException('Нельзя копировать свой подарок');
    }
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      raised: _raised,
      copied: _copied,
      owner: _owner,
      offers: _offers,
      wishlists: _wishlists,
      ...wishData
    } = wish;
    await this.wishesRepository.update(
      { id: wishId },
      { copied: (Number(wish.copied) || 0) + 1 },
    );
    return this.wishesRepository.save(
      this.wishesRepository.create({
        ...wishData,
        owner: { id: userId } as Wish['owner'],
        raised: 0,
        copied: 0,
      } as Partial<Wish>),
    );
  }
}
