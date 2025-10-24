export class MarkAsReadCommand {
  constructor(
    public readonly userId: string,
    public readonly emailId: string,
    public readonly isRead: boolean = true,
  ) {}
}
