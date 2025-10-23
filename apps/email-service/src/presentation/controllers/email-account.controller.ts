import { Controller, Post, Get, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateEmailAccountDto, UpdateEmailAccountDto } from '../dtos';
import { CreateEmailAccountCommand, UpdateEmailAccountCommand, DeleteEmailAccountCommand } from '../../application/commands';
import { GetEmailAccountByIdQuery, GetUserEmailAccountsQuery } from '../../application/queries';

/**
 * Email Account Controller
 * Manages user email accounts (SMTP/IMAP configurations)
 */
@ApiTags('Email Accounts')
@Controller('accounts')
// @UseGuards(JwtAuthGuard) // TODO: Add JWT auth guard when integrated with auth service
@ApiBearerAuth()
export class EmailAccountController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new email account' })
  @ApiResponse({
    status: 201,
    description: 'Email account created successfully',
  })
  @ApiResponse({ status: 409, description: 'Email account already exists' })
  async createEmailAccount(
    @Body() dto: CreateEmailAccountDto,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT token
  ) {
    // Temporary: hardcoded userId for development
    const userId = 'temp-user-id';

    const result = await this.commandBus.execute(
      new CreateEmailAccountCommand(userId, dto.email, dto.displayName, dto.username, dto.password, dto.smtpConfig, dto.imapConfig),
    );

    return {
      message: 'Email account created successfully',
      ...result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all email accounts for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of email accounts retrieved successfully',
  })
  async getUserEmailAccounts() {
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT token
    // Temporary: hardcoded userId for development
    const userId = 'temp-user-id';

    const accounts = await this.queryBus.execute(new GetUserEmailAccountsQuery(userId));

    return {
      message: 'Email accounts retrieved successfully',
      count: accounts.length,
      accounts,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email account by ID' })
  @ApiParam({ name: 'id', description: 'Email account ID' })
  @ApiResponse({
    status: 200,
    description: 'Email account retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Email account not found' })
  async getEmailAccountById(
    @Param('id') emailAccountId: string,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT token
  ) {
    // Temporary: hardcoded userId for development
    const userId = 'temp-user-id';

    const account = await this.queryBus.execute(new GetEmailAccountByIdQuery(emailAccountId, userId));

    return {
      message: 'Email account retrieved successfully',
      account,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update email account configuration' })
  @ApiParam({ name: 'id', description: 'Email account ID' })
  @ApiResponse({
    status: 200,
    description: 'Email account updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Email account not found' })
  async updateEmailAccount(
    @Param('id') emailAccountId: string,
    @Body() dto: UpdateEmailAccountDto,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT token
  ) {
    // Temporary: hardcoded userId for development
    const userId = 'temp-user-id';

    await this.commandBus.execute(new UpdateEmailAccountCommand(emailAccountId, userId, dto.displayName, dto.smtpConfig, dto.imapConfig));

    return {
      message: 'Email account updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete email account' })
  @ApiParam({ name: 'id', description: 'Email account ID' })
  @ApiResponse({
    status: 200,
    description: 'Email account deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Email account not found' })
  async deleteEmailAccount(
    @Param('id') emailAccountId: string,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT token
  ) {
    // Temporary: hardcoded userId for development
    const userId = 'temp-user-id';

    await this.commandBus.execute(new DeleteEmailAccountCommand(emailAccountId, userId));

    return {
      message: 'Email account deleted successfully',
    };
  }
}
