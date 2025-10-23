import {
  IsString,
  IsNotEmpty,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SmtpConfigDto, ImapConfigDto } from './create-email-account.dto';

export class UpdateEmailAccountDto {
  @ApiProperty({
    example: 'My Work Email (Updated)',
    description: 'Display name for this email account',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  displayName: string;

  @ApiProperty({ type: SmtpConfigDto, description: 'SMTP configuration' })
  @ValidateNested()
  @Type(() => SmtpConfigDto)
  smtpConfig: SmtpConfigDto;

  @ApiProperty({ type: ImapConfigDto, description: 'IMAP configuration' })
  @ValidateNested()
  @Type(() => ImapConfigDto)
  imapConfig: ImapConfigDto;
}
