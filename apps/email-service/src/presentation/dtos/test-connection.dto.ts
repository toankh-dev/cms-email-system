import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

export class SmtpConfigDto {
  @ApiProperty({ example: 'smtp.gmail.com' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ example: 587 })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  secure: boolean;
}

export class ImapConfigDto {
  @ApiProperty({ example: 'imap.gmail.com' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ example: 993 })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  tls: boolean;
}

export class TestConnectionDto {
  @ApiProperty({ example: 'your-email@gmail.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'your-app-password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ type: SmtpConfigDto })
  smtp: SmtpConfigDto;

  @ApiProperty({ type: ImapConfigDto })
  imap: ImapConfigDto;
}
