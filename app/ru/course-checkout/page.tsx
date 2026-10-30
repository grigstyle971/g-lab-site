import CheckoutPage from '../../account-pages/CheckoutPage';
import type { Metadata } from 'next';
export const dynamic='force-dynamic';
export const metadata:Metadata={
  title:'Оплата курса',
  description:'Страница покупки курса G-lab: 16 практических уроков по созданию и запуску сайта. Текущая цена и доступность оплаты указаны на странице.',
  robots:{index:false,follow:false},
  openGraph:{
    title:'Оплата курса G-lab',
    description:'Текущая цена и доступность онлайн-оплаты практического курса G-lab.',
    type:'website',
    locale:'ru_RU',
    images:['/g-lab-social.jpg'],
  },
  twitter:{
    card:'summary_large_image',
    title:'Оплата курса G-lab',
    description:'Текущая цена и доступность онлайн-оплаты практического курса G-lab.',
  },
};
export default function Page(){return <CheckoutPage locale='ru'/>;}
