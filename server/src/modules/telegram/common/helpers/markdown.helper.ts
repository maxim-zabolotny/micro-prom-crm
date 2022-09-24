/*external modules*/
import { escapeMarkdown, md } from 'telegram-escape';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MarkdownHelper {
  static bold(text: string): string {
    return md`*${text}*`;
  }

  static italic(text: string): string {
    return md`_${text}_`;
  }

  static monospaced(text: string): string {
    return `\`${text}\``;
  }

  static escape(text: string | number): string {
    return md`${text}`;
  }

  static json(text: string): string {
    return escapeMarkdown('```json\n' + text + '\n```');
  }
}
