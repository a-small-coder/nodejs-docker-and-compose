import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DeepPartial, In } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Wish } from '../wishes/entities/wish.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistsRepository: Repository<Wishlist>,
    @InjectRepository(Wish)
    private wishesRepository: Repository<Wish>,
  ) {}

  private async ensureWishIdsExist(itemsIds: number[]): Promise<void> {
    if (itemsIds.length === 0) return;
    const found = await this.wishesRepository.find({
      where: { id: In(itemsIds) },
    });
    if (found.length !== itemsIds.length) {
      throw new BadRequestException('Один или несколько подарков не найдены');
    }
  }

  async create(data: CreateWishlistDto & { owner: Pick<User, 'id'> }) {
    const { itemsId, ...rest } = data;
    if (itemsId?.length) {
      await this.ensureWishIdsExist(itemsId);
    }
    const entity = this.wishlistsRepository.create({
      ...rest,
      items: itemsId?.map((id) => ({ id })),
    } as DeepPartial<Wishlist>);
    return this.wishlistsRepository.save(entity);
  }

  findOne(where: FindOptionsWhere<Wishlist>) {
    return this.wishlistsRepository.findOne({
      where,
      relations: ['items', 'owner'],
    });
  }

  find(where: FindOptionsWhere<Wishlist>) {
    return this.wishlistsRepository.find({
      where,
      relations: ['items', 'owner'],
    });
  }

  async updateOne(
    where: FindOptionsWhere<Wishlist>,
    updateWishlistDto: UpdateWishlistDto,
  ) {
    await this.wishlistsRepository.update(
      where,
      updateWishlistDto as Partial<Wishlist>,
    );
    return this.wishlistsRepository.findOne({ where });
  }

  removeOne(where: FindOptionsWhere<Wishlist>) {
    return this.wishlistsRepository.delete(where);
  }

  async updateWishlistIfAllowed(
    userId: number,
    wishlistId: number,
    updateWishlistDto: UpdateWishlistDto,
  ) {
    const wishlist = await this.wishlistsRepository.findOne({
      where: { id: wishlistId },
      relations: ['owner'],
    });
    if (!wishlist) {
      throw new NotFoundException('Подборка не найдена');
    }
    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('Нельзя редактировать чужую подборку');
    }
    const { itemsId, ...rest } = updateWishlistDto;
    if (itemsId !== undefined) {
      await this.ensureWishIdsExist(itemsId);
      wishlist.items = itemsId.map((id) => ({ id } as Wishlist['items'][0]));
    }
    Object.assign(wishlist, rest);
    await this.wishlistsRepository.save(wishlist);
    return this.wishlistsRepository.findOne({
      where: { id: wishlistId },
      relations: ['items', 'owner'],
    });
  }

  async removeWishlistIfAllowed(userId: number, wishlistId: number) {
    const wishlist = await this.wishlistsRepository.findOne({
      where: { id: wishlistId },
      relations: ['owner'],
    });
    if (!wishlist) {
      throw new NotFoundException('Подборка не найдена');
    }
    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException('Нельзя удалять чужую подборку');
    }
    return this.wishlistsRepository.delete({ id: wishlistId });
  }
}
