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
          <RovasComponent
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

    <ControlForm
      :accountId="account.id"
      v-if="pageMounted"
    />

    <TransactionMultiEditForm v-if="selectedRows.size" />

    <TableComponent
      :columns="columns"
      :rows="rows"
      @select="selectedRows = $event"
      :checkbox="true"
    >
      <template #account-data="{ row }">
        {{ accountById(row.account)?.name }}
      </template>

      <template #in-data="{ row }">
        <span
          :class="getAmountColor(row as unknown as Z_Transaction)"
          v-if="row.in !== 0"
        >
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(parseFloat(row.in))
          }}
        </span>
        <span v-else>&nbsp;</span>
      </template>

      <template #out-data="{ row }">
        <span
          :class="getAmountColor(row as unknown as Z_Transaction)"
          v-if="row.out !== 0"
        >
          {{
            new Intl.NumberFormat('en-GB', {
              style: 'currency',
              currency: 'GBP'
            }).format(parseFloat(row.out))
          }}
        </span>
        <span v-else>&nbsp;</span>
      </template>

      <template #category-data="{ row }">
        {{ categoryById(row.category)?.name }}
      </template>

      <template #when-data="{ row }">
        {{ moment(row.when).format('YYYY MMM DD') }}
      </template>

      <template #actions-data="{ row }">
        <TransactionActionMenu
          :row="row"
          @refetch="refetch"
        />
      </template>
    </TableComponent>
  </div>
</template>

<script setup lang="ts">
import TransactionActionMenu from '@/components/transaction/TransactionActionMenu.vue';
import TransactionMultiEditForm from '@/components/transaction/TransactionMultiEditForm.vue';
import ControlForm from '@/components/ui/ControlForm.vue';
import RovasComponent from '@/components/ui/RovasComponent.vue';
import TableComponent from '@/components/ui/TableComponent.vue';
import { usePagination } from '@/composables/usePagination';
import { useDataStore } from '@/stores/dataStore';
import { z_filterBy, type Z_Account, type Z_Transaction, type Z_Transactions } from '@/types';
import { getAmountColor } from '@/utils/helpers';
import { CreditCardIcon } from '@heroicons/vue/24/outline';
import Chart from 'chart.js/auto';
import moment from 'moment';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref, watch, type ComputedRef, type Ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const dataStore = useDataStore();
const { accountById, categoryById } = dataStore;
const { accounts } = storeToRefs(dataStore);

const pagination = usePagination();

const pageMounted: Ref<boolean> = ref(false);

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
    key: 'account',
    label: 'Account',
    sortable: true
  },
  {
    key: 'in',
    label: 'In',
    sortable: true
  },
  {
    key: 'out',
    label: 'Out',
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
  pagination.reset();

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

  const dataSetNoPending: DataSet = {
    type: 'line',
    label: `${a.name}`,
    data: [],
    fill: false
  };

  chartLabels.value.forEach((l: any) => {
    const balance = dataStore.accountBalanceAt(a.id, moment(l).endOf('month').toDate(), false);

    dataSetNoPending.data.push({
      x: l === todayLabel ? 'Today' : l,
      y: balance
    });
  });

  chartData.value.push(dataSetNoPending);

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
};

onMounted(() => {
  console.log('%cAccount view mouunted...', 'color:#17A589');
  pagination.reset();
  pagination.setPage(1);
  pagination.setTotalCount(0);
  pagination.setPerPage(50);

  pageMounted.value = true;

  setTimeout(() => {
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
  }, 1000);
});

onUnmounted(() => {
  pagination.reset();
  unsubscribe();
});
</script>
