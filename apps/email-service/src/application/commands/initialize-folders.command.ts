export class InitializeFoldersCommand {
  constructor(
    public readonly userId: string,
    public readonly emailAccountId: string,
  ) {}
}
