import DashboardPage from '../../account-pages/DashboardPage';
export const dynamic='force-dynamic';
export const metadata={title:'Account',robots:{index:false,follow:false}};
export default function Page(props:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <DashboardPage {...props} locale='en'/>;}
