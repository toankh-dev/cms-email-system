import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailRecipient, EmailAttachment } from '../../domain/models/email.aggregate';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SendEmailOptions {
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  inReplyTo?: string;
  references?: string[];
}

export interface SendEmailResult {
  messageId: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  private transporters: Map<string, Transporter> = new Map();

  /**
   * Get or create transporter for email account
   */
  private async getTransporter(
    accountId: string,
    config: SmtpConfig,
  ): Promise<Transporter> {
    if (this.transporters.has(accountId)) {
      return this.transporters.get(accountId)!;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    // Verify connection
    try {
      await transporter.verify();
      this.logger.log(`SMTP transporter verified for account ${accountId}`);
      this.transporters.set(accountId, transporter);
      return transporter;
    } catch (error) {
      this.logger.error(
        `Failed to verify SMTP transporter for account ${accountId}`,
        error,
      );
      throw new Error(`SMTP connection failed: ${error.message}`);
    }
  }

  /**
   * Send email via SMTP
   */
  async sendEmail(
    accountId: string,
    config: SmtpConfig,
    options: SendEmailOptions,
  ): Promise<SendEmailResult> {
    try {
      const transporter = await this.getTransporter(accountId, config);

      const mailOptions = {
        from: this.formatRecipient(options.from),
        to: options.to.map((r) => this.formatRecipient(r)).join(', '),
        cc: options.cc?.map((r) => this.formatRecipient(r)).join(', '),
        bcc: options.bcc?.map((r) => this.formatRecipient(r)).join(', '),
        replyTo: options.replyTo
          ? this.formatRecipient(options.replyTo)
          : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        inReplyTo: options.inReplyTo,
        references: options.references,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType,
          cid: att.cid,
        })),
      };

      const info = await transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully. MessageId: ${info.messageId}`,
      );

      return {
        messageId: info.messageId,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Failed to send email for account ${accountId}`, error);
      return {
        messageId: '',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Test SMTP connection
   */
  async testConnection(config: SmtpConfig): Promise<boolean> {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
      });

      await transporter.verify();
      this.logger.log('SMTP connection test successful');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection test failed', error);
      return false;
    }
  }

  /**
   * Close transporter for account
   */
  closeTransporter(accountId: string): void {
    const transporter = this.transporters.get(accountId);
    if (transporter) {
      transporter.close();
      this.transporters.delete(accountId);
      this.logger.log(`SMTP transporter closed for account ${accountId}`);
    }
  }

  /**
   * Format recipient for nodemailer
   */
  private formatRecipient(recipient: EmailRecipient): string {
    if (recipient.name) {
      return `"${recipient.name}" <${recipient.email}>`;
    }
    return recipient.email;
  }
}
