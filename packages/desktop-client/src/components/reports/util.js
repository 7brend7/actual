import { runQuery } from 'loot-core/src/client/query-helpers';

export function fromDateRepr(date) {
  return date.slice(0, 7);
}

export function fromDateReprToDay(date) {
  return date;
}

export async function runAll(queries, cb) {
  let data = await Promise.all(
    queries.map(q => {
      return runQuery(q).then(({ data }) => data);
    }),
  );
  cb(data);
}

export function index(data, field, mapper) {
  const result = {};
  data.forEach(item => {
    result[mapper ? mapper(item[field]) : item[field]] = item;
  });
  return result;
}

// https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
export const groupBy = (xs, key) =>
  xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
