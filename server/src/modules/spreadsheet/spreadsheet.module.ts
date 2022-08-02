/*external modules*/
import { Global, Module } from '@nestjs/common';
/*services*/
import { SpreadsheetService } from './spreadsheet.service';
/*controllers*/

/*@entities*/

@Global()
@Module({
  providers: [SpreadsheetService],
  exports: [SpreadsheetService],
})
export class SpreadsheetModule {}
