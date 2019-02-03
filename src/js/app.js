import Vue from 'vue';
import App from '../component/App.vue';

import '../lib/jquery/jquery-ui-1.12.1.min.js';
import '../lib/jquery/jquery.ui.touch-punch.min.js';
//import '../lib/turnjs/modernizr.2.5.3.min.js';

//- bootstrap4
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import '../css/jquery.ui.css';
import '../css/magazine.css';
import '../lib/font-awesome/css/font-awesome.min.css';

//console.log('process.env.NODE_ENV', process.env.NODE_ENV); // eslint-disable-line
//console.log('__DEV__', __DEV__); // eslint-disable-line

export default new Vue({
  el: '#app',
  render: h => h(App)
});
