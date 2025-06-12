import { Toast } from '@capacitor/toast';

export const showToast = async (message: string) => {
  await Toast.show({
    text: message,
    duration: 'long',
  });
};
