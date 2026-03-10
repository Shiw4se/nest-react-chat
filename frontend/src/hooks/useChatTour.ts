import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useTranslation } from 'react-i18next';

export const useChatTour = (isEnabled: boolean, userId?: string) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isEnabled || !userId) return;

    const storageKey = `chat-tour-seen-${userId}`;
    const hasSeenTour = localStorage.getItem(storageKey);
    if (hasSeenTour) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      nextBtnText: t('tour.nextBtnText'),
      prevBtnText: t('tour.prevBtnText'),
      doneBtnText: t('tour.doneBtnText'),
      onDestroyed: () => {
        localStorage.setItem(storageKey, 'true');
      },
      steps: [
        {
          element: '#tour-sidebar-tabs',
          popover: {
            title: t('tour.sidebar_tabs_title'),
            description: t('tour.sidebar_tabs_desc'),
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-sidebar-rooms',
          popover: {
            title: t('tour.sidebar_rooms_title'),
            description: t('tour.sidebar_rooms_desc'),
            side: 'right',
            align: 'center',
          },
        },
        {
          element: '#tour-create-room',
          popover: {
            title: t('tour.create_room_title'),
            description: t('tour.create_room_desc'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-header',
          popover: {
            title: t('tour.header_title'),
            description: t('tour.header_desc'),
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-messages',
          popover: {
            title: t('tour.messages_title'),
            description: t('tour.messages_desc'),
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-input',
          popover: {
            title: t('tour.input_title'),
            description: t('tour.input_desc'),
            side: 'top',
            align: 'center',
          },
        },
      ],
    });

    const timer = setTimeout(() => {
      driverObj.drive();
    }, 500);

    return () => clearTimeout(timer);
  }, [isEnabled, userId, t]);
};