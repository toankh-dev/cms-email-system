import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  SendEmailCommand,
  SaveDraftCommand,
  MarkAsReadCommand,
  ToggleStarCommand,
  MoveEmailCommand,
} from '../../application/commands';
import {
  GetEmailByIdQuery,
  ListEmailsQuery,
} from '../../application/queries';
import { SendEmailDto, SaveDraftDto } from '../dtos';

@ApiTags('Emails')
@Controller('emails')
export class EmailController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // POST /emails/send - Send email
  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 201, description: 'Email sent successfully' })
  async sendEmail(@Body() dto: SendEmailDto) {
    // TODO: Get userId from JWT token
    const userId = 'temp-user-id';

    const command = new SendEmailCommand(
      userId,
      dto.emailAccountId,
      dto.from,
      dto.to,
      dto.subject,
      dto.textBody,
      dto.htmlBody,
      dto.cc,
      dto.bcc,
      undefined, // attachments - to be implemented
      dto.inReplyTo,
      dto.references,
    );

    return this.commandBus.execute(command);
  }

  // POST /emails/drafts - Save draft
  @Post('drafts')
  @ApiOperation({ summary: 'Save email as draft' })
  @ApiResponse({ status: 201, description: 'Draft saved successfully' })
  async saveDraft(@Body() dto: SaveDraftDto) {
    const userId = 'temp-user-id';

    const command = new SaveDraftCommand(
      userId,
      dto.emailAccountId,
      dto.from,
      dto.to,
      dto.subject,
      dto.textBody,
      dto.htmlBody,
      dto.cc,
      dto.bcc,
    );

    return this.commandBus.execute(command);
  }

  // GET /emails - List emails with filters
  @Get()
  @ApiOperation({ summary: 'List emails with pagination and filters' })
  @ApiQuery({ name: 'emailAccountId', required: false })
  @ApiQuery({ name: 'folderId', required: false })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'isStarred', required: false, type: Boolean })
  @ApiQuery({ name: 'searchQuery', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listEmails(
    @Query('emailAccountId') emailAccountId?: string,
    @Query('folderId') folderId?: string,
    @Query('isRead') isRead?: boolean,
    @Query('isStarred') isStarred?: boolean,
    @Query('searchQuery') searchQuery?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = 'temp-user-id';

    const query = new ListEmailsQuery(
      userId,
      emailAccountId,
      folderId,
      isRead,
      isStarred,
      undefined, // isSpam
      searchQuery,
      page || 1,
      limit || 50,
    );

    return this.queryBus.execute(query);
  }

  // GET /emails/:id - Get email detail
  @Get(':id')
  @ApiOperation({ summary: 'Get email by ID' })
  @ApiResponse({ status: 200, description: 'Email details' })
  async getEmailById(@Param('id') id: string) {
    const userId = 'temp-user-id';
    const query = new GetEmailByIdQuery(userId, id);
    return this.queryBus.execute(query);
  }

  // PATCH /emails/:id/read - Mark as read/unread
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark email as read or unread' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  async markAsRead(
    @Param('id') id: string,
    @Query('isRead') isRead: boolean = true,
  ) {
    const userId = 'temp-user-id';
    const command = new MarkAsReadCommand(userId, id, isRead);
    await this.commandBus.execute(command);
  }

  // PATCH /emails/:id/star - Toggle star
  @Patch(':id/star')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Toggle email star' })
  async toggleStar(@Param('id') id: string) {
    const userId = 'temp-user-id';
    const command = new ToggleStarCommand(userId, id);
    await this.commandBus.execute(command);
  }

  // PATCH /emails/:id/move - Move to folder
  @Patch(':id/move')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Move email to folder' })
  @ApiQuery({ name: 'folderId', required: true })
  async moveToFolder(
    @Param('id') id: string,
    @Query('folderId') folderId: string,
  ) {
    const userId = 'temp-user-id';
    const command = new MoveEmailCommand(userId, id, folderId);
    await this.commandBus.execute(command);
  }
}
