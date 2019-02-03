<style lang="stylus" src="entry.styl"></style>

<template lang="pug">
#app
  transition(name="fade" mode="out-in")
    Book
</template>

<script>

import Book from './Book.vue'

export default {
  data() {
		return {
		};
  },
  components: {
		Book
  }
};
</script>

