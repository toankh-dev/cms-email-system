export class UpdateFolderCommand {
  constructor(
    public readonly folderId: string,
    public readonly userId: string,
    public readonly name?: string,
    public readonly icon?: string,
    public readonly color?: string,
  ) {}
}
