import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { EmailRecipient, EmailAttachment } from '../../domain/models/email.aggregate';

export interface ImapConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
}

export interface FetchedEmail {
  messageId: string;
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: EmailAttachment[];
  receivedAt: Date;
}

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);
  private connections: Map<string, Imap> = new Map();

  /**
   * Get or create IMAP connection
   */
  private getConnection(accountId: string, config: ImapConfig): Imap {
    if (this.connections.has(accountId)) {
      return this.connections.get(accountId)!;
    }

    const connection = new Imap({
      user: config.user,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.connections.set(accountId, connection);
    return connection;
  }

  /**
   * Fetch unread emails from INBOX
   */
  async fetchUnreadEmails(
    accountId: string,
    config: ImapConfig,
    limit: number = 50,
  ): Promise<FetchedEmail[]> {
    return new Promise((resolve, reject) => {
      const imap = this.getConnection(accountId, config);
      const emails: FetchedEmail[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            this.logger.error('Failed to open INBOX', err);
            return reject(err);
          }

          // Search for unread emails
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              this.logger.error('Failed to search emails', err);
              return reject(err);
            }

            if (!results || results.length === 0) {
              this.logger.log('No unread emails found');
              imap.end();
              return resolve([]);
            }

            // Limit results
            const uidList = results.slice(0, limit);
            const fetch = imap.fetch(uidList, { bodies: '' });

            fetch.on('message', (msg, seqno) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    this.logger.error('Failed to parse email', err);
                    return;
                  }

                  try {
                    const email = this.parseEmail(parsed);
                    emails.push(email);
                  } catch (error) {
                    this.logger.error('Failed to convert parsed email', error);
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              this.logger.error('Fetch error', err);
              reject(err);
            });

            fetch.once('end', () => {
              this.logger.log(`Fetched ${emails.length} emails`);
              imap.end();
            });
          });
        });
      });

      imap.once('error', (err) => {
        this.logger.error('IMAP connection error', err);
        reject(err);
      });

      imap.once('end', () => {
        this.logger.log('IMAP connection ended');
        resolve(emails);
      });

      imap.connect();
    });
  }

  /**
   * Test IMAP connection
   */
  async testConnection(config: ImapConfig): Promise<boolean> {
    return new Promise((resolve) => {
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port,
        tls: config.tls,
        tlsOptions: { rejectUnauthorized: false },
      });

      imap.once('ready', () => {
        this.logger.log('IMAP connection test successful');
        imap.end();
        resolve(true);
      });

      imap.once('error', (err) => {
        this.logger.error('IMAP connection test failed', err);
        resolve(false);
      });

      imap.connect();
    });
  }

  /**
   * Parse email from mailparser result
   */
  private parseEmail(parsed: ParsedMail): FetchedEmail {
    const from: EmailRecipient = {
      email: parsed.from?.value[0]?.address || '',
      name: parsed.from?.value[0]?.name,
    };

    const to: EmailRecipient[] =
      parsed.to?.value.map((addr) => ({
        email: addr.address || '',
        name: addr.name,
      })) || [];

    const cc: EmailRecipient[] | undefined = parsed.cc?.value.map((addr) => ({
      email: addr.address || '',
      name: addr.name,
    }));

    const attachments: EmailAttachment[] | undefined = parsed.attachments?.map(
      (att) => ({
        filename: att.filename || 'untitled',
        contentType: att.contentType,
        size: att.size,
        cid: att.cid,
      }),
    );

    return {
      messageId: parsed.messageId || '',
      from,
      to,
      cc,
      subject: parsed.subject || '',
      textBody: parsed.text,
      htmlBody: parsed.html ? parsed.html.toString() : undefined,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references,
      attachments,
      receivedAt: parsed.date || new Date(),
    };
  }

  /**
   * Close IMAP connection
   */
  closeConnection(accountId: string): void {
    const connection = this.connections.get(accountId);
    if (connection) {
      connection.end();
      this.connections.delete(accountId);
      this.logger.log(`IMAP connection closed for account ${accountId}`);
    }
  }
}
