import {fetch as fetchPolyfill} from 'whatwg-fetch';
if (!global.fetch) {
  global.fetch = fetchPolyfill;
}
