import * as d from 'date-fns';

import q from 'loot-core/src/client/query-helpers';
import * as monthUtils from 'loot-core/src/shared/months';

import { runAll } from '../util';

export function byCategories(selectedMonth) {
  return async (spreadsheet, setData) => {
    const start = d.startOfMonth(monthUtils.parseDate(selectedMonth));
    const end = d.endOfMonth(monthUtils.parseDate(selectedMonth));
    runAll(
      [
        q('transactions')
          .filter({
            $and: [
              { amount: { $lt: 0 } },
              { date: { $gte: start } },
              { date: { $lte: end } },
            ],
            'account.offbudget': false,
          })
          .select('*'),
      ],
      data => {
        setData(data);
      },
    );
  };
}
