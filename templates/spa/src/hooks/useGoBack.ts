import { useNavigate, useRouter } from '@tanstack/react-router';

export const useGoBack = () => {
  const navigate = useNavigate();
  const router = useRouter();

  const goBack = () => {
    if (router.history.length > 1) {
      router.history.back();
      return;
    }
    navigate({ to: '/' });
  };

  return goBack;
};
