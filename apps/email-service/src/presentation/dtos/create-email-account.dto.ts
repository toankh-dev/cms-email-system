import { IsEmail, IsNotEmpty, IsString, IsNumber, IsBoolean, ValidateNested, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SmtpConfigDto {
  @ApiProperty({ example: 'smtp.gmail.com', description: 'SMTP server host' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ example: 587, description: 'SMTP server port' })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({
    example: false,
    description: 'Use secure connection (true for port 465)',
  })
  @IsBoolean()
  secure: boolean;
}

export class ImapConfigDto {
  @ApiProperty({ example: 'imap.gmail.com', description: 'IMAP server host' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ example: 993, description: 'IMAP server port' })
  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ example: true, description: 'Use TLS encryption' })
  @IsBoolean()
  tls: boolean;
}

export class CreateEmailAccountDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'My Work Email',
    description: 'Display name for this email account',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  displayName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Username for SMTP/IMAP authentication',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'app-specific-password',
    description: 'Password for SMTP/IMAP authentication',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ type: SmtpConfigDto, description: 'SMTP configuration' })
  @ValidateNested()
  @Type(() => SmtpConfigDto)
  smtpConfig: SmtpConfigDto;

  @ApiProperty({ type: ImapConfigDto, description: 'IMAP configuration' })
  @ValidateNested()
  @Type(() => ImapConfigDto)
  imapConfig: ImapConfigDto;
}
