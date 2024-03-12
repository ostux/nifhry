<template>
  <div
    class="max-wmx-auto w-full max-w-6xl px-2 md:px-6 lg:px-8"
    v-if="account"
  >
    <div class="flex justify-between pb-4">
      <div class="flex flex-row">
        <CreditCardIcon class="mr-4 size-6" />
        <div class="flex flex-col">
          <span>{{ account.name }}</span>
          <rovas-component
            class="text-3xl"
            :msg="account.name"
          />
        </div>
      </div>
      <div>
        <span>balance:</span>

        <div
          class="flex flex-grow justify-center font-mono text-4xl"
          :class="[account.balance < 0 ? 'text-red-500' : 'text-pine-green-500']"
        >
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(account.balance)
          }}
        </div>
      </div>
    </div>

    <canvas ref="canvas"></canvas>

    <pagination-componnt @change="refetch" />
    <transaction-multi-edit-form v-if="selectedRows.size" />

    <table-component
      :columns="columns"
      :rows="rows"
      @select="selectedRows = $event"
      :checkbox="true"
    >
      <template #from-data="{ row }">
        {{ accountById(row.from)?.name }}
      </template>

      <template #amount-data="{ row }">
        <span :class="getAmountColor(row as unknown as Z_Transaction)">
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(parseFloat(row.amount))
          }}
        </span>
      </template>

      <template #to-data="{ row }">
        {{ accountById(row.to)?.name }}
      </template>

      <template #category-data="{ row }">
        {{ categoryById(row.category)?.name }}
      </template>

      <template #when-data="{ row }">
        {{ moment(row.when).format('YYYY MMM DD') }}
      </template>

      <template #actions-data="{ row }">
        <transaction-action-menu
          :row="row"
          @refetch="refetch"
        />
      </template>
    </table-component>
  </div>
</template>

<script setup lang="ts">
import { usePagination } from '@/composables/usePagination';
import { useDataStore } from '@/stores/dataStore';
import { z_filterBy, type Z_Account, type Z_Transactions, nullUUID, type Z_Transaction } from '@/types';
import { storeToRefs } from 'pinia';
import { watch, type Ref, ref, type ComputedRef, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { CreditCardIcon } from '@heroicons/vue/24/outline';
import RovasComponent from '@/components/ui/RovasComponent.vue';
import moment from 'moment';
import TableComponent from '@/components/ui/TableComponent.vue';
import TransactionActionMenu from '@/components/transaction/TransactionActionMenu.vue';
import TransactionMultiEditForm from '@/components/transaction/TransactionMultiEditForm.vue';
import PaginationComponnt from '@/components/ui/PaginationComponnt.vue';

import Chart from 'chart.js/auto';

const route = useRoute();

const dataStore = useDataStore();
const { accountById, categoryById } = dataStore;
const { accounts } = storeToRefs(dataStore);

const pagination = usePagination();

const account: ComputedRef<Z_Account | undefined> = computed(() => accounts.value.get(route.params.slug as unknown as string));

const canvas: Ref<HTMLCanvasElement | undefined> = ref(undefined);

const chartData: Ref<any[]> = ref([]);
const chartLabels: Ref<string[]> = ref([]);

const todayLabel = moment().format('YYYY-MM');

const rows: Ref<Z_Transactions> = ref([]);

const selectedRows: ComputedRef<Set<string>> = computed(() => pagination.selected.value);

const columns = [
  {
    key: 'desc',
    label: 'Description'
  },
  {
    key: 'from',
    label: 'From',
    sortable: true
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true
  },
  {
    key: 'to',
    label: 'To',
    sortable: true
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true
  },
  {
    key: 'when',
    label: 'When',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true
  },
  {
    key: 'actions'
  }
];

const refetch = () => {
  pagination.setFilter([{ column: 'account', by: z_filterBy.enum.eq, value: account.value?.id }]);

  rows.value = dataStore.fetchTransactions();
};

const getAmountColor = (row: Z_Transaction) => {
  if (row.from !== nullUUID && row.to !== nullUUID) return 'text-sky-500';

  return row.amount < 0 ? 'text-rose-500' : 'text-pine-green-500';
};

const unsubscribe = dataStore.$onAction(
  ({
    name, // name of the action
    after // hook after the action returns or resolves
  }) => {
    if (name === 'fetchTransactions') {
      after(() => {
        setTimeout(() => {
          pagination.finishLoading();
        }, 300);
      });
    }
  }
);

watch([account], () => {
  pagination.clearSelected();
  refetch();
});

watch(
  [pagination.isLoading],
  (loading) => {
    if (loading) refetch();
  },
  { deep: true }
);

interface DataSet {
  type: 'line';
  label: string;
  data: any;
  fill?: any;
}

const populateLineChart = () => {
  if (!account.value) return;

  const a = account.value;

  const start = moment().subtract(6, 'months').toDate();
  const end = moment().endOf('year').toDate();

  pagination.setRangeFilter({
    from: start,
    to: end
  });

  const inRangeTransactions = dataStore.fetchRangeTransactions();

  chartLabels.value = inRangeTransactions.map((t: Z_Transaction) => moment(t.when).format('YYYY-MM'));

  chartLabels.value.push(moment(start).startOf('month').format('YYYY-MM'));
  chartLabels.value.push(todayLabel);
  chartLabels.value.push(moment(end).endOf('month').format('YYYY-MM'));

  const labelsSet = new Set(chartLabels.value);
  chartLabels.value = Array.from(labelsSet);

  chartLabels.value = chartLabels.value.sort((a: string, b: string) => {
    if (moment(b).isBefore(moment(a))) {
      return 1;
    } else if (moment(a).isBefore(moment(b))) {
      return -1;
    }
    return 0;
  });

  const dataSet: DataSet = {
    type: 'line',
    label: a.name,
    data: [],
    fill: false
  };

  chartLabels.value.forEach((l: any) => {
    const balance = dataStore.accountBalanceAt(a.id, moment(l).endOf('month').toDate());

    dataSet.data.push({
      x: l === todayLabel ? 'Today' : l,
      y: balance
    });
  });

  chartData.value.push(dataSet);

  const dataSetPending: DataSet = {
    type: 'line',
    label: `${a.name} - with pending`,
    data: [],
    fill: false
  };

  chartLabels.value.forEach((l: any) => {
    const balance = dataStore.accountBalanceAt(a.id, moment(l).endOf('month').toDate(), true);

    dataSetPending.data.push({
      x: l === todayLabel ? 'Today' : l,
      y: balance
    });
  });

  chartData.value.push(dataSetPending);

  const possibleEndPalance: DataSet = {
    type: 'line',
    label: `${a.name} - with last year spending`,
    data: [],
    fill: false
  };

  chartLabels.value.forEach((l: any) => {
    let balance = dataStore.accountBalanceAt(a.id, moment(l).endOf('month').toDate(), true);
    // const previousMonthBalance = dataStore.accountBalanceAt(a.id, moment(l).subtract(1, 'month').endOf('month').toDate(), true);
    // const beforePreviousMonthBalance = dataStore.accountBalanceAt(
    //   a.id,
    //   moment(l).subtract(2, 'month').endOf('month').toDate(),
    //   true
    // );

    // let diff = Math.abs(previousMonthBalance - beforePreviousMonthBalance);

    if (moment(l).isSameOrAfter(moment(), 'month')) {
      const accountMonthOutAt = dataStore.accountMonthOutAt(a.id, moment(l).subtract(1, 'year').toDate());
      const accountMonthInAt = dataStore.accountMonthInAt(a.id, moment(l).toDate(), true);
      const targetMonthPendingBalance = dataStore.accountMonthOutAt(a.id, moment(l).toDate(), true, true);

      let diff = accountMonthInAt - Math.abs(accountMonthOutAt - targetMonthPendingBalance);

      console.log(
        diff,
        accountMonthInAt,
        accountMonthOutAt,
        targetMonthPendingBalance,
        Math.abs(accountMonthOutAt - targetMonthPendingBalance)
      );
      if (moment().isSame(moment(l), 'month')) {
        balance = balance - Math.abs(diff);
      } else balance = balance - Math.abs(diff * 1.2);
    }

    possibleEndPalance.data.push({
      x: l === todayLabel ? 'Today' : l,
      y: balance
    });
  });

  chartData.value.push(possibleEndPalance);
};

onMounted(() => {
  pagination.clearSelected();
  pagination.setShowPending(false);
  pagination.setDayFilter(null);
  pagination.setPagination(1, 1_00);

  refetch();

  populateLineChart();
  chartLabels.value = chartLabels.value.map((l) => (l === todayLabel ? 'Today' : l));

  if (canvas.value) {
    new Chart(canvas.value, {
      data: {
        datasets: [...chartData.value],
        labels: [...chartLabels.value]
      },
      plugins: [
        {
          id: 'today',
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const todayTick = xAxis.getTicks().findIndex((t) => t.label === 'Today');
            const yAxis = chart.scales.y;
            var x = xAxis.getPixelForTick(todayTick);
            ctx.save();
            ctx.strokeStyle = '#17A589';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, yAxis.bottom);
            ctx.lineTo(x, 50);
            ctx.stroke();
            ctx.restore();
          }
        },
        {
          id: 'zero',
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            var x = xAxis.getPixelForTick(0);
            var xEnd = xAxis.getPixelForTick(xAxis.getTicks().length - 1);
            var y = yAxis.getPixelForTick(yAxis.getTicks().findIndex((f) => f.value === 0));
            ctx.save();
            ctx.strokeStyle = '#17A589';
            ctx.setLineDash([15, 5]);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(xEnd, y);
            ctx.stroke();
            ctx.restore();
          }
        }
      ],
      options: {
        scales: {
          x: {
            stacked: true
          },
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
});

onUnmounted(() => {
  pagination.clearSelected();
  unsubscribe();
});
</script>
