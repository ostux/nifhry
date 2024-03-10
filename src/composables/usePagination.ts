import { type Z_DayFilter, type Z_Filter, type Z_Pagination, type Z_Sort } from '@/types';
import { ref, type Ref } from 'vue';

const pagination: Ref<Z_Pagination> = ref({
  page: 1,
  perPage: 1_000_000,
  totalCount: 0
});

const sorts: Ref<Z_Sort[]> = ref([]);

const filters: Ref<Z_Filter[]> = ref([]);

const selected: Ref<Set<string>> = ref(new Set());

const dayFilter: Ref<Z_DayFilter | null> = ref(null);

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

  const setFilter = (f: Z_Filter[]) => {
    filters.value = f;
  };

  const setDayFilter = (df: Z_DayFilter | null) => {
    dayFilter.value = df;
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

  return {
    pagination,
    sorts,
    filters,
    selected,
    dayFilter,
    setPagination,
    setPage,
    setPerPage,
    setTotalCount,
    setSort,
    setFilter,
    setDayFilter,
    setSelected,
    addToSelected,
    removeFromSelected,
    clearSelected
  };
}
