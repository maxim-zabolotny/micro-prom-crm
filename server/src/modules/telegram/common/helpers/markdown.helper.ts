/*external modules*/
import { Injectable } from '@nestjs/common';

@Injectable()
export class MarkdownHelper {
  static bold(text: string): string {
    return `*${text}*`;
  }

  static monospaced(text: string): string {
    return `\`${text}\``;
  }
}
