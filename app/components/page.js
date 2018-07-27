import Vue from 'vue'

Vue.component('page', {
  delimiters: ['${', '}'],
  template: '#component-template--page',
  data: function() {
    return {
    }
  },

  mounted() {
    console.log('Hi.')
  },

  methods: {
  },
})
