/*external modules*/
import * as _ from 'lodash';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DataUtilsHelper {
  getDiff<T>(newArr: T[], oldArr: T[]) {
    const added = _.difference(newArr, oldArr);
    const removed = _.difference(oldArr, newArr);
    const intersection = _.intersection(newArr, oldArr);

    return { added, removed, intersection };
  }
}
