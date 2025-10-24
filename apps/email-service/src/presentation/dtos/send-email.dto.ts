import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EmailRecipientDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendEmailDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  emailAccountId: string;

  @ApiProperty({ type: EmailRecipientDto })
  @ValidateNested()
  @Type(() => EmailRecipientDto)
  from: EmailRecipientDto;

  @ApiProperty({ type: [EmailRecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  to: EmailRecipientDto[];

  @ApiProperty({ example: 'Meeting Tomorrow' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  subject: string;

  @ApiPropertyOptional({ example: 'Plain text body' })
  @IsOptional()
  @IsString()
  textBody?: string;

  @ApiPropertyOptional({ example: '<p>HTML body</p>' })
  @IsOptional()
  @IsString()
  htmlBody?: string;

  @ApiPropertyOptional({ type: [EmailRecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  cc?: EmailRecipientDto[];

  @ApiPropertyOptional({ type: [EmailRecipientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailRecipientDto)
  bcc?: EmailRecipientDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inReplyTo?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  references?: string[];
}
