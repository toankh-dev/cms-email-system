export class CreateFolderCommand {
  constructor(
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly name: string,
    public readonly parentId?: string,
    public readonly icon?: string,
    public readonly color?: string,
  ) {}
}
