export class GetEmailByIdQuery {
  constructor(
    public readonly userId: string,
    public readonly emailId: string,
  ) {}
}
