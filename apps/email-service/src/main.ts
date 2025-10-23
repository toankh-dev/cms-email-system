import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@app/common';

async function bootstrap() {
  const logger = new Logger('EmailService');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3002;

  app.setGlobalPrefix('api/emails');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Email Service API')
    .setDescription('Email Service for CMS Email System - Manages email accounts, folders, and email operations (SMTP/IMAP)')
    .setVersion('0.3.0')
    .addBearerAuth()
    .addTag('Email Accounts', 'Manage user email accounts (SMTP/IMAP configurations)')
    .addTag('Emails', 'Send, receive, and manage emails')
    .addTag('Folders', 'Manage email folders')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/emails/docs', app, document);

  await app.listen(port);
  logger.log(`📧 Email Service is running on: http://localhost:${port}/api/emails`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/emails/docs`);
}

bootstrap();
