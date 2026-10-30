import {createRoot} from 'react-dom/client';
import {OwnerAccessPanel} from '../components/OwnerAccessPanel';
createRoot(document.getElementById('root')!).render(<main className="account-page"><OwnerAccessPanel ru={new URLSearchParams(location.search).get('lang')==='ru'}/></main>);
