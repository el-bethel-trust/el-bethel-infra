import { render } from 'preact';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import App from './App';

const root = document.getElementById('root');
if (root) {
  defineCustomElements(window);
  render(<App />, root);
}
