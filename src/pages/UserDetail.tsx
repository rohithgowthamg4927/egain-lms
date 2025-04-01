
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const UserDetail = () => {
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

  return null; // This component just redirects
};

export default UserDetail;
