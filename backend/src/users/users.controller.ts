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
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { WishesService } from '../wishes/wishes.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { HashService } from '../hash/hash.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
    private readonly wishesService: WishesService,
  ) {}

  @Get('me/wishes')
  getMyWishes(@Request() req: { user: User }) {
    return this.wishesService.find({ owner: { id: req.user.id } });
  }

  @Get(':username/wishes')
  async getAnotherUserWishes(@Param('username') username: string) {
    const user = await this.usersService.findOne({ username });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return this.wishesService.find({ owner: { id: user.id } });
  }

  // @Post()
  // create(@Body() createUserDto: CreateUserDto) {
  //   return this.usersService.create(createUserDto);
  // }

  @Get()
  findAll() {
    return this.usersService.find({});
  }

  @Get('me')
  getMe(@Request() req: { user: User }) {
    const { password: _password, ...result } = req.user;
    return result;
  }

  @Patch('me')
  async updateMe(
    @Request() req: { user: User },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const id = req.user.id;
    const update: Partial<User> = { ...updateProfileDto };
    if (updateProfileDto.password) {
      update.password = await this.hashService.hash(updateProfileDto.password);
    }
    const user = await this.usersService.updateOne(
      { id },
      update as UpdateUserDto,
    );
    if (!user) throw new NotFoundException();
    return user;
  }

  @Post('find')
  async findUsers(@Body() body: { query: string }) {
    const query = body?.query ?? '';
    const users = await this.usersService.findMany(query);
    return users.map(({ email: _email, ...u }) => u);
  }

  @Get(':idOrUsername')
  async findOne(@Param('idOrUsername') idOrUsername: string) {
    const numId = +idOrUsername;
    const where = Number.isNaN(numId)
      ? { username: idOrUsername }
      : { id: numId };
    const user = await this.usersService.findOne(where);
    if (!user) throw new NotFoundException('Пользователь не найден');
    const { email: _email, ...publicUser } = user;
    return publicUser;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user: User },
  ) {
    const numId = +id;
    if (Number.isNaN(numId)) {
      throw new BadRequestException('Некорректный id');
    }
    if (numId !== req.user.id) {
      throw new ForbiddenException('Можно редактировать только свой профиль');
    }
    return this.usersService.updateOne({ id: numId }, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: { user: User }) {
    const numId = +id;
    if (Number.isNaN(numId)) {
      throw new BadRequestException('Некорректный id');
    }
    if (numId !== req.user.id) {
      throw new ForbiddenException('Можно удалять только свой профиль');
    }
    return this.usersService.removeOne({ id: numId });
  }
}
