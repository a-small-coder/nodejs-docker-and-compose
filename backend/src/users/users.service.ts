import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type UserWithoutPassword = Omit<User, 'password'>;

function stripPassword(user: User): UserWithoutPassword {
  const { password: _password, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    const user = await this.usersRepository.save(
      this.usersRepository.create(createUserDto),
    );
    return stripPassword(user);
  }

  //  Для проверки при логине AuthService
  findOneWithPassword(where: FindOptionsWhere<User>) {
    return this.usersRepository.findOne({ where });
  }

  async findOne(
    where: FindOptionsWhere<User>,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersRepository.findOne({ where });
    return user ? stripPassword(user) : null;
  }

  async find(where: FindOptionsWhere<User>): Promise<UserWithoutPassword[]> {
    const users = await this.usersRepository.find({ where });
    return users.map(stripPassword);
  }

  async findMany(query: string): Promise<UserWithoutPassword[]> {
    const users = await this.usersRepository.find({
      where: [
        { username: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
    });
    return users.map(stripPassword);
  }

  async updateOne(
    where: FindOptionsWhere<User>,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithoutPassword | null> {
    await this.usersRepository.update(where, updateUserDto as Partial<User>);
    const user = await this.usersRepository.findOne({ where });
    return user ? stripPassword(user) : null;
  }

  removeOne(where: FindOptionsWhere<User>) {
    return this.usersRepository.delete(where);
  }
}
