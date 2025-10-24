export class MoveEmailCommand {
  constructor(
    public readonly userId: string,
    public readonly emailId: string,
    public readonly targetFolderId: string,
  ) {}
}
