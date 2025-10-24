export class GetFolderByIdQuery {
  constructor(
    public readonly folderId: string,
    public readonly userId: string,
  ) {}
}
