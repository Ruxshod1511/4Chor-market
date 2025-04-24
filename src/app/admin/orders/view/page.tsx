import { Suspense } from 'react';
import OrderViewClient from './OrderViewClient';
import Loading from '../../../loading';

export default function OrderViewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <OrderViewClient />
    </Suspense>
  );
}