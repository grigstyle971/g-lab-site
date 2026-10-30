import RootLayout, { getSiteMetadata } from "../RootLayout";
export const metadata=getSiteMetadata("ru");
export default function Layout({children}:{children:React.ReactNode}){return <RootLayout locale="ru">{children}</RootLayout>;}
