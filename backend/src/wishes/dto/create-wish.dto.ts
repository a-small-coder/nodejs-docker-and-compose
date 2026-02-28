import { IsString, IsNumber, IsUrl, Min, MaxLength } from 'class-validator';

export class CreateWishDto {
  @IsString()
  @MaxLength(250)
  name: string;

  @IsString()
  link: string;

  @IsString()
  @IsUrl()
  image: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @MaxLength(1024)
  description: string;
}
