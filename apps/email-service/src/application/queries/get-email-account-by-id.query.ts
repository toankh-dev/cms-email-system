export class GetEmailAccountByIdQuery {
  constructor(
    public readonly emailAccountId: string,
    public readonly userId: string,
  ) {}
}
