/*external modules*/
import { Global, Module } from '@nestjs/common';
/*services*/
import { SpreadsheetService } from './spreadsheet.service';
import { TimeHelper } from '@common/helpers';
/*controllers*/

/*@entities*/

@Global()
@Module({
  providers: [TimeHelper, SpreadsheetService],
  exports: [SpreadsheetService],
})
export class SpreadsheetModule {}
