import React, { useEffect, useState, useMemo } from 'react';

import * as d from 'date-fns';
import Highcharts from 'highcharts';
import drilldown from 'highcharts/modules/drilldown.js';
import HighchartsReact from 'highcharts-react-official';

import { send } from 'loot-core/src/platform/client/fetch';
import * as monthUtils from 'loot-core/src/shared/months';

import ArrowLeft from '../../icons/v1/ArrowLeft';
import { styles } from '../../style';
import { View, ButtonLink, Select, LinkButton } from '../common';

import { byCategories } from './graphs/by-categories-spreadsheet';
import useReport from './useReport';
import { groupBy } from './util';

drilldown(Highcharts);

let options = {
  chart: {
    type: 'pie',
    events: {
      drilldown: function (e) {
        debugger;
        setTimeout(() => {
          const element = document.querySelector(
            '.highcharts-breadcrumbs-group',
          );
          const link = document.createElement('a');
          link.textContent = 'open';

          link.addEventListener('click', () => {
            debugger;
          });

          element.insertAdjacentElement('afterend', link);
        }, 100);
      },
    },
  },
  title: {
    text: '',
  },
  tooltip: {
    pointFormat: '{point.y:,.2f}',
  },
  plotOptions: {
    pie: {
      showInLegend: true,
    },
    series: {
      point: {},
      dataLabels: {
        enabled: true,
        format: '{point.name}: {point.y:,.0f}',
      },
    },
  },
  series: [
    {
      name: 'Categories',
      colorByPoint: true,
      data: [],
    },
  ],
  drilldown: {
    series: [],
  },
};

export default function ByCategories() {
  const [allMonths, setAllMonths] = useState(null);
  const [categories, setCategories] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(monthUtils.currentMonth());

  const params = useMemo(() => byCategories(selectedMonth), [selectedMonth]);
  const data = useReport('by_categories', params);

  useEffect(() => {
    async function run() {
      const trans = await send('get-earliest-transaction');
      const categories = await send('get-categories');
      const earliestMonth = trans
        ? monthUtils.monthFromDate(d.parseISO(trans.date))
        : monthUtils.currentMonth();

      const allMonths = monthUtils
        .rangeInclusive(earliestMonth, monthUtils.currentMonth())
        .map(month => ({
          name: month,
          pretty: monthUtils.format(month, 'MMMM, yyyy'),
        }))
        .reverse();

      setAllMonths(allMonths);
      setCategories(groupBy(categories['list'], 'id'));
    }
    run();
  }, []);

  if (!allMonths || !data || !categories) {
    return null;
  }

  const series = groupBy(
    Object.values(groupBy(data[0], 'notes')).map(arr =>
      arr.reduce((acc, cur) => ({
        ...cur,
        amount: acc.amount + cur.amount,
      })),
    ),
    'category',
  );
  options = {
    ...options,
    series: [
      {
        data: Object.keys(series).map(item => ({
          name:
            categories[item] && categories[item].length > 0
              ? categories[item][0]['name']
              : 'None',
          y: series[item].reduce(
            (abs, curr) => abs + Math.abs(curr.amount / 100),
            0,
          ),
          drilldown: item ? item : 'none',
        })),
      },
    ],
    drilldown: {
      breadcrumbs: {
        useHTML: true,
      },
      series: Object.keys(series).map(item => ({
        name:
          categories[item] && categories[item].length > 0
            ? categories[item][0]['name']
            : 'None',
        id: item ? item : 'none',
        data: series[item].map(curr => [
          curr.notes,
          Math.abs(curr.amount / 100),
        ]),
      })),
    },
  };

  console.log(options);
  return (
    <View style={[styles.page, { minWidth: 650, overflow: 'hidden' }]}>
      <View
        style={{
          padding: 20,
          paddingTop: 0,
          flexShrink: 0,
        }}
      >
        <ButtonLink
          to="/reports"
          bare
          style={{ marginBottom: '15', alignSelf: 'flex-start' }}
        >
          <ArrowLeft width={10} height={10} style={{ marginRight: 5 }} /> Back
        </ButtonLink>
        <View style={styles.veryLargeText}>By Categories</View>
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'auto',
            marginTop: 15,
          }}
        >
          <Select
            style={{ flex: 0, backgroundColor: 'white', marginBottom: 20 }}
            onChange={e => {
              setSelectedMonth(e.target.value);
            }}
            value={selectedMonth}
          >
            {allMonths.map(month => (
              <option key={month.name} value={month.name}>
                {month.pretty}
              </option>
            ))}
          </Select>
          <LinkButton
            id="openCategory"
            _target="blank"
            onClick={() => {
              debugger;
            }}
          >
            open
          </LinkButton>
          <HighchartsReact highcharts={Highcharts} options={options} />
        </View>
      </View>
    </View>
  );
}
