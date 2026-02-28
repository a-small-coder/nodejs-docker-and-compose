import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DeepPartial } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { Wish } from '../wishes/entities/wish.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    @InjectRepository(Wish)
    private wishesRepository: Repository<Wish>,
    private readonly emailService: EmailService,
  ) {}

  async createOfferWithChecks(userId: number, dto: CreateOfferDto) {
    const wish = await this.wishesRepository.findOne({
      where: { id: dto.itemId },
      relations: ['owner'],
    });
    if (!wish) throw new NotFoundException('Подарок не найден');
    if (!wish.owner) {
      throw new NotFoundException('Владелец подарка не найден');
    }
    if (wish.owner.id === userId) {
      throw new BadRequestException('Нельзя скидываться на свой подарок');
    }
    const raised = Number(wish.raised);
    const price = Number(wish.price);
    if (raised >= price) {
      throw new BadRequestException('На этот подарок уже собраны средства');
    }
    const amount = Number(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Сумма заявки должна быть больше нуля');
    }
    if (raised + amount > price) {
      throw new BadRequestException('Сумма заявки превышает недостающую сумму');
    }
    const offer = await this.offersRepository.save(
      this.offersRepository.create({
        amount: dto.amount,
        hidden: dto.hidden ?? false,
        user: { id: userId },
        item: { id: dto.itemId },
      } as DeepPartial<Offer>),
    );
    await this.wishesRepository.update(
      { id: dto.itemId },
      { raised: raised + amount },
    );
    await this.emailService.notifyOfferParticipants(dto.itemId, [offer.id]);
    return offer;
  }

  create(createOfferDto: CreateOfferDto) {
    return this.offersRepository.save(
      this.offersRepository.create(createOfferDto as Partial<Offer>),
    );
  }

  findOne(where: FindOptionsWhere<Offer>) {
    return this.offersRepository.findOne({ where });
  }

  find(where: FindOptionsWhere<Offer>) {
    return this.offersRepository.find({ where });
  }

  async updateOne(
    where: FindOptionsWhere<Offer>,
    updateOfferDto: UpdateOfferDto,
  ) {
    await this.offersRepository.update(where, updateOfferDto as Partial<Offer>);
    return this.offersRepository.findOne({ where });
  }

  removeOne(where: FindOptionsWhere<Offer>) {
    return this.offersRepository.delete(where);
  }
}
