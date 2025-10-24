import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({
    example: 'Work Projects',
    description: 'Folder name',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Parent folder ID (for nested folders)',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    example: 'folder',
    description: 'Icon name or emoji',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  icon?: string;

  @ApiPropertyOptional({
    example: '#3B82F6',
    description: 'Folder color (hex format)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, {
    message: 'Color must be in hex format (e.g., #3B82F6)',
  })
  color?: string;
}
