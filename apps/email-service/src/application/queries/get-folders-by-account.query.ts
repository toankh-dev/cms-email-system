export class GetFoldersByAccountQuery {
  constructor(
    public readonly emailAccountId: string,
    public readonly userId: string,
  ) {}
}
