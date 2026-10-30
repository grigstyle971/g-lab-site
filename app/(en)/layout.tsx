import RootLayout, { getSiteMetadata } from "../RootLayout";
export const metadata=getSiteMetadata("en");
export default function Layout({children}:{children:React.ReactNode}){return <RootLayout locale="en">{children}</RootLayout>;}
