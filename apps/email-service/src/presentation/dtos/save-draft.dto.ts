import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmailRecipientDto } from './send-email.dto';

export class SaveDraftDto {
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

  @ApiProperty({ example: 'Draft Subject' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textBody?: string;

  @ApiPropertyOptional()
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
}
