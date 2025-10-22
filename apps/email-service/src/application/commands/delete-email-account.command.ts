export class DeleteEmailAccountCommand {
  constructor(
    public readonly emailAccountId: string,
    public readonly userId: string,
  ) {}
}
