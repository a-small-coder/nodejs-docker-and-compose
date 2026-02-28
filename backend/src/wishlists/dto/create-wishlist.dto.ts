import {
  IsString,
  IsOptional,
  MaxLength,
  IsNumber,
  IsArray,
} from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  @MaxLength(250)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  itemIds?: number[];
}
