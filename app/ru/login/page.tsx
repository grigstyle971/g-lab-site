import LoginPage from '../../account-pages/LoginPage';
export const dynamic='force-dynamic';
export const metadata={title:'Войти в G-lab',robots:{index:false,follow:false}};
export default function Page(props:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <LoginPage {...props} locale='ru'/>;}
