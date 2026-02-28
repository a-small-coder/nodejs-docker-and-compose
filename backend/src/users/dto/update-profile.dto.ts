import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  about?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
