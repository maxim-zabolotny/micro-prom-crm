export class Parser {
  public readonly page: string;

  constructor(page: string) {
    this.page = page;
  }

  static async load(url: string) {
    console.log('url => ', url);
    return new Parser('');
  }
}
