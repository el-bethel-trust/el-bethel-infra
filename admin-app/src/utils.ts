import { Toast } from '@capacitor/toast';
import { Capacitor } from '@capacitor/core';
//@ts-ignore
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

export const showToast = async (message: string) => {
  if (Capacitor.isNativePlatform()) {
    await Toast.show({ text: message, duration: 'long' });
  } else {
    toastr.info(message, { timeout: 3500 });
  }
};
