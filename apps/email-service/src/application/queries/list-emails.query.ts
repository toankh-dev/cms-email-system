export class ListEmailsQuery {
  constructor(
    public readonly userId: string,
    public readonly emailAccountId?: string,
    public readonly folderId?: string,
    public readonly isRead?: boolean,
    public readonly isStarred?: boolean,
    public readonly isSpam?: boolean,
    public readonly searchQuery?: string,
    public readonly page: number = 1,
    public readonly limit: number = 50,
  ) {}
}
