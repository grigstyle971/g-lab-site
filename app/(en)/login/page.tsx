import LoginPage from '../../account-pages/LoginPage';
export const dynamic='force-dynamic';
export const metadata={title:'Sign in to G-lab',robots:{index:false,follow:false}};
export default function Page(props:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <LoginPage {...props} locale='en'/>;}
