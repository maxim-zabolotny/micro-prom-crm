import { Injectable } from '@nestjs/common';

@Injectable()
export class CrmService {
  echo(text: string): string {
    return `Echo: ${text}`;
  }
}
