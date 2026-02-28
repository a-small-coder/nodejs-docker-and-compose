import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { HashService } from '../hash/hash.service';
import { SignUpDto } from './dto/signup.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.usersService.findOneWithPassword({ username });
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.hashService.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signUp(signUpDto: SignUpDto) {
    const existingByEmail = await this.usersService.findOne({
      email: signUpDto.email,
    });
    if (existingByEmail) {
      throw new BadRequestException('Email уже используется');
    }

    const existingByUsername = await this.usersService.findOne({
      username: signUpDto.username,
    });
    if (existingByUsername) {
      throw new BadRequestException('Имя пользователя уже используется');
    }

    if (!signUpDto?.password || typeof signUpDto.password !== 'string') {
      throw new BadRequestException('Поле password обязательно');
    }
    const passwordHash = await this.hashService.hash(signUpDto.password);

    const user = await this.usersService.create({
      username: signUpDto.username,
      email: signUpDto.email,
      password: passwordHash,
      avatar: signUpDto.avatar,
      about: signUpDto.about,
    });

    return user;
  }
}
