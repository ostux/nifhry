<template>
  <div>
    {{ swap }}
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef } from 'vue';

const props = defineProps({
  msg: {
    type: String,
    default: ''
  }
});

const swap: ComputedRef<string> = computed(() => {
  return props.msg
    .split('')
    .map((c: string) => abc(c))
    .join('');
});

interface ABC {
  [key: string]: string;
}

const abc = (c: string) => {
  const rovas: ABC = {
    a: '\u{10CC0}',
    b: '\u{10CC2}',
    c: '\u{10CC4}',
    d: '\u{10CC7}',
    e: '\u{10CC9}',
    f: '\u{10CCC}',
    g: '\u{10CCD}',
    h: '\u{10CD0}',
    i: '\u{10CD0}',
    j: '\u{10CD2}',
    k: '\u{10CD3}',
    l: '\u{10CD6}',
    m: '\u{10CD8}',
    n: '\u{10CD9}',
    o: '\u{10CDB}',
    p: '\u{10CE0}',
    q: '\u{10CE1}',
    r: '\u{10CE2}',
    s: '\u{10CE4}',
    t: '\u{10CE6}',
    u: '\u{10CEA}',
    v: '\u{10CEE}',
    w: '\u{10CF0}',
    x: '\u{10CF1}',
    y: '\u{10CF2}',
    z: '\u{10CEF}',

    A: '\u{10C80}',
    B: '\u{10C82}',
    C: '\u{10C84}',
    D: '\u{10C87}',
    E: '\u{10C89}',
    F: '\u{10C8C}',
    G: '\u{10C8D}',
    H: '\u{10C8F}',
    I: '\u{10C90}',
    J: '\u{10C92}',
    K: '\u{10C93}',
    L: '\u{10C96}',
    M: '\u{10C98}',
    N: '\u{10C99}',
    O: '\u{10C9B}',
    P: '\u{10CA0}',
    Q: '\u{10CA1}',
    R: '\u{10CA2}',
    S: '\u{10CA4}',
    T: '\u{10CA6}',
    U: '\u{10CAA}',
    V: '\u{10CAE}',
    W: '\u{10C80}',
    X: '\u{10C81}',
    Y: '\u{10C82}',
    Z: '\u{10CAF}'
  };

  return rovas[c] || c;
};
</script>
