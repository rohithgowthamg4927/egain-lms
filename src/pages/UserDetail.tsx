
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

interface UserDetailProps {
  // Add any props if needed
}

const UserDetail: React.FC<UserDetailProps> = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new UserProfile page
    if (userId) {
      navigate(`/users/${userId}`, { replace: true });
    } else {
      navigate(-1);
    }
  }, [userId, navigate]);

  return (
    <Layout noHeader={true}>
      <div className="p-6">
        <p>Redirecting to user profile...</p>
      </div>
    </Layout>
  );
};

export default UserDetail;
