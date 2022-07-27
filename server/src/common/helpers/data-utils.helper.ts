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

  splitStringArrByLength(arr: string[], maxLength: number): string[][] {
    const result: string[][] = [];

    let currentArr = [];
    let currentLength = 0;
    _.forEach(arr, (item) => {
      const nextLength = currentLength + item.length;
      if (nextLength > maxLength) {
        result.push(currentArr);

        currentLength = item.length;
        currentArr = [item];

        return;
      }

      currentLength += item.length;
      currentArr.push(item);
    });

    return result;
  }
}
