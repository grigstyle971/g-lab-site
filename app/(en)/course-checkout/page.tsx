import CheckoutPage from '../../account-pages/CheckoutPage';
import type { Metadata } from 'next';
export const dynamic='force-dynamic';
export const metadata:Metadata={
  title:'Course checkout',
  description:'Purchase access to G-lab’s 16 practical lessons for building your first website. The current price and payment availability are shown on this page.',
  robots:{index:false,follow:false},
  openGraph:{
    title:'G-lab course checkout',
    description:'Review the course price and current online payment availability.',
    type:'website',
    images:['/g-lab-social.jpg'],
  },
  twitter:{
    card:'summary_large_image',
    title:'G-lab course checkout',
    description:'Review the course price and current online payment availability.',
  },
};
export default function Page(){return <CheckoutPage locale='en'/>;}
