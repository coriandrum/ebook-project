import Vue from 'vue';
import App from '../component/App.vue';

console.log('process.env.NODE_ENV', process.env.NODE_ENV); // eslint-disable-line
console.log('__DEV__', __DEV__); // eslint-disable-line

export default new Vue({
  el: '#app',
  render: h => h(App)
});
