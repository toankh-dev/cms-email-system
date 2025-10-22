export class UpdateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly fullName?: string,
  ) {}
}
