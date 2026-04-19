/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App.js'
import './styles.css'
import { t } from '@/lib/i18n'

const root = document.getElementById('root')
if (!root) throw new Error(t('app.root_element_not_found'))

render(() => <App />, root)
