import { type Z_DayFilter, type Z_Filter, type Z_Pagination, type z_dateRangeFilter, type Z_Sort } from '@/types';
import { ref, type Ref } from 'vue';

const pagination: Ref<Z_Pagination> = ref({
  page: 1,
  perPage: 1_000,
  totalCount: 0
});
const sorts: Ref<Z_Sort[]> = ref([]);
const filters: Ref<Z_Filter[]> = ref([]);
const showPending: Ref<boolean> = ref(false);
const selected: Ref<Set<string>> = ref(new Set());
const dayFilter: Ref<Z_DayFilter | null> = ref(null);
const rangeFilter: Ref<z_dateRangeFilter | null> = ref(null);
const isLoading: Ref<boolean> = ref(false);

export function usePagination() {
  const setPagination = (page: number, perPage: number) => {
    const tc = pagination.value.totalCount;
    pagination.value = {
      page: page,
      perPage: perPage,
      totalCount: tc
    };
  };

  const setPage = (p: number) => {
    pagination.value.page = p;
  };

  const setPerPage = (pp: number) => {
    pagination.value.perPage = pp;
  };

  const setTotalCount = (tc: number) => {
    pagination.value.totalCount = tc;
  };

  const setSort = (s: Z_Sort[]) => {
    sorts.value = s;
  };

  const setFilter = (fs: Z_Filter[]) => {
    const newFilters: Z_Filter[] = [];
    fs.forEach((newFilter) => {
      const existIndex = filters.value.findIndex((oldFilter) => oldFilter.column === newFilter.column);
      if (existIndex >= 0) {
        filters.value[existIndex].value = newFilter.value;
      } else {
        newFilters.push(newFilter);
      }
    });

    filters.value = [...filters.value, ...newFilters];
  };

  const removeFilter = (id: string) => {
    filters.value = filters.value.filter((f) => f.column !== id);
  };

  const clearFilter = () => {
    filters.value = [];
  };

  const setDayFilter = (df: Z_DayFilter | null) => {
    dayFilter.value = df;
  };

  const setRangeFilter = (rf: z_dateRangeFilter | null) => {
    rangeFilter.value = rf;
  };

  const setShowPending = (p: boolean) => {
    showPending.value = p;
  };

  const setSelected = (s: Set<string>) => {
    selected.value = s;
  };

  const addToSelected = (id: string) => {
    selected.value.add(id);
  };

  const removeFromSelected = (id: string) => {
    selected.value.delete(id);
  };

  const clearSelected = () => {
    selected.value = new Set();
  };

  const startLoading = () => {
    console.log('%cPagination: loading...', 'color:#17A589');
    if (isLoading.value) return;

    isLoading.value = true;
  };

  const finishLoading = () => {
    console.log('%cPagination: loading done...', 'color:#17A589');

    isLoading.value = false;
  };

  const reset = () => {
    pagination.value = {
      page: 1,
      perPage: 1_00_000,
      totalCount: 0
    };
    sorts.value = [];
    filters.value = [];
    showPending.value = false;
    selected.value = new Set();
    dayFilter.value = null;
    rangeFilter.value = null;
  };

  return {
    isLoading,
    pagination,
    sorts,
    filters,
    selected,
    dayFilter,
    rangeFilter,
    showPending,
    setPagination,
    setPage,
    setPerPage,
    setTotalCount,
    setSort,
    setFilter,
    removeFilter,
    clearFilter,
    setDayFilter,
    setRangeFilter,
    setShowPending,
    setSelected,
    addToSelected,
    removeFromSelected,
    clearSelected,
    startLoading,
    finishLoading,
    reset
  };
}
