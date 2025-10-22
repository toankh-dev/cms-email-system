import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
} from '../dtos';
import {
  RegisterUserCommand,
  LoginUserCommand,
  RefreshTokenCommand,
  VerifyEmailCommand,
  ChangePasswordCommand,
  ForgotPasswordCommand,
  ResetPasswordCommand,
  UpdateProfileCommand,
} from '../../application/commands';
import { GetUserByIdQuery } from '../../application/queries';
import { JwtAuthGuard, Public, CurrentUser } from '../../infrastructure/auth';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    const result = await this.commandBus.execute(
      new RegisterUserCommand(dto.email, dto.password, dto.fullName),
    );

    return {
      message: 'User registered successfully. Please verify your email.',
      userId: result.userId,
      // In production, send this via email instead of returning it
      emailVerificationToken: result.emailVerificationToken,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const result = await this.commandBus.execute(
      new LoginUserCommand(dto.email, dto.password),
    );

    return {
      message: 'Login successful',
      ...result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const result = await this.commandBus.execute(
      new RefreshTokenCommand(dto.refreshToken),
    );

    return {
      message: 'Token refreshed successfully',
      ...result,
    };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'Invalid verification token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.commandBus.execute(new VerifyEmailCommand(dto.token));

    return {
      message: 'Email verified successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('sub') userId: string) {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));

    return {
      message: 'Profile retrieved successfully',
      user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const result = await this.commandBus.execute(
      new UpdateProfileCommand(userId, dto.fullName),
    );

    return {
      message: 'Profile updated successfully',
      user: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.commandBus.execute(
      new ChangePasswordCommand(userId, dto.currentPassword, dto.newPassword),
    );

    return {
      message: 'Password changed successfully',
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset (forgot password)' })
  @ApiResponse({
    status: 200,
    description: 'Password reset token sent successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.commandBus.execute(
      new ForgotPasswordCommand(dto.email),
    );

    return {
      message: 'Password reset instructions sent to your email',
      // In production, send this via email instead of returning it
      token: result.token,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with reset token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.commandBus.execute(
      new ResetPasswordCommand(dto.token, dto.newPassword),
    );

    return {
      message: 'Password reset successfully',
    };
  }
}
