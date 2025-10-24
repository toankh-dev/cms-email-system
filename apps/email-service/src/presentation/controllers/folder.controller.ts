import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateFolderDto, UpdateFolderDto } from '../dtos';
import {
  InitializeFoldersCommand,
  CreateFolderCommand,
  UpdateFolderCommand,
  DeleteFolderCommand,
} from '../../application/commands';
import {
  GetFolderByIdQuery,
  GetFoldersByAccountQuery,
} from '../../application/queries';

/**
 * Folder Controller
 * Manages email folders with hierarchy support
 */
@ApiTags('Folders')
@Controller('folders')
@ApiBearerAuth()
export class FolderController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('initialize/:emailAccountId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initialize system folders for email account' })
  @ApiParam({ name: 'emailAccountId', description: 'Email account ID' })
  @ApiResponse({
    status: 201,
    description: 'System folders initialized successfully',
  })
  async initializeFolders(
    @Param('emailAccountId') emailAccountId: string,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT
  ) {
    const userId = 'temp-user-id'; // Temporary

    const result = await this.commandBus.execute(
      new InitializeFoldersCommand(userId, emailAccountId),
    );

    return {
      message: 'System folders initialized successfully',
      ...result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get folders for email account' })
  @ApiQuery({
    name: 'emailAccountId',
    description: 'Email account ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Folders retrieved successfully',
  })
  async getFolders(
    @Query('emailAccountId') emailAccountId: string,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT
  ) {
    const userId = 'temp-user-id'; // Temporary

    const folders = await this.queryBus.execute(
      new GetFoldersByAccountQuery(emailAccountId, userId),
    );

    return {
      message: 'Folders retrieved successfully',
      count: folders.length,
      folders,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder by ID' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({
    status: 200,
    description: 'Folder retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  async getFolderById(
    @Param('id') folderId: string,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT
  ) {
    const userId = 'temp-user-id'; // Temporary

    const folder = await this.queryBus.execute(
      new GetFolderByIdQuery(folderId, userId),
    );

    return {
      message: 'Folder retrieved successfully',
      folder,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create custom folder' })
  @ApiQuery({
    name: 'emailAccountId',
    description: 'Email account ID',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid folder data' })
  async createFolder(
    @Query('emailAccountId') emailAccountId: string,
    @Body() dto: CreateFolderDto,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT
  ) {
    const userId = 'temp-user-id'; // Temporary

    const result = await this.commandBus.execute(
      new CreateFolderCommand(
        userId,
        emailAccountId,
        dto.name,
        dto.parentId,
        dto.icon,
        dto.color,
      ),
    );

    return {
      message: 'Folder created successfully',
      ...result,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({
    status: 200,
    description: 'Folder updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot update system folders',
  })
  async updateFolder(
    @Param('id') folderId: string,
    @Body() dto: UpdateFolderDto,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT
  ) {
    const userId = 'temp-user-id'; // Temporary

    await this.commandBus.execute(
      new UpdateFolderCommand(
        folderId,
        userId,
        dto.name,
        dto.icon,
        dto.color,
      ),
    );

    return {
      message: 'Folder updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete folder' })
  @ApiParam({ name: 'id', description: 'Folder ID' })
  @ApiResponse({
    status: 200,
    description: 'Folder deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete system folders or folders with subfolders',
  })
  async deleteFolder(
    @Param('id') folderId: string,
    // @CurrentUser('sub') userId: string, // TODO: Get from JWT
  ) {
    const userId = 'temp-user-id'; // Temporary

    await this.commandBus.execute(new DeleteFolderCommand(folderId, userId));

    return {
      message: 'Folder deleted successfully',
    };
  }
}
