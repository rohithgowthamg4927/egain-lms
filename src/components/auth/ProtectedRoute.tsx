
import { Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

const ProtectedRoute = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
