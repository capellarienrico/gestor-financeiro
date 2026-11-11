import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export const DEFAULT_NOTIFICATION_SETTINGS = {
  dailyReminderEnabled: true,
  dailyReminderTime: '21:00',
  invoiceReminderEnabled: true,
  goalAlertEnabled: true
}

/**
 * Request notification permissions from either Capacitor Native or Web Browser
 */
export async function requestNotificationPermissions() {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.requestPermissions()
      return status.display === 'granted'
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
  } catch (err) {
    console.warn('Erro ao solicitar permissão de notificações:', err)
  }
  return false
}

/**
 * Check if notifications are granted
 */
export async function checkNotificationPermissions() {
  try {
    if (Capacitor.isNativePlatform()) {
      const status = await LocalNotifications.checkPermissions()
      return status.display === 'granted'
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted'
    }
  } catch (err) {
    console.warn('Erro ao verificar permissão de notificações:', err)
  }
  return false
}

/**
 * Configure all scheduled notifications according to user settings
 */
export async function applyNotificationSettings(settings, creditCardDueDay = 25) {
  if (!settings) return

  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Daily Reminder (ID 1001)
      if (settings.dailyReminderEnabled && settings.dailyReminderTime) {
        const [hourStr, minStr] = settings.dailyReminderTime.split(':')
        const targetHour = parseInt(hourStr, 10) || 21
        const targetMin = parseInt(minStr, 10) || 0

        const now = new Date()
        const scheduleDate = new Date()
        scheduleDate.setHours(targetHour, targetMin, 0, 0)

        // If today's time has already passed, schedule for tomorrow
        if (scheduleDate.getTime() <= now.getTime()) {
          scheduleDate.setDate(scheduleDate.getDate() + 1)
        }

        // Cancel previous and reschedule
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] })
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1001,
              title: 'Hora do Fechamento Diário ☕',
              body: 'Como foram seus gastos hoje? Toque para conferir o saldo e manter seus dias em dia.',
              schedule: {
                at: scheduleDate,
                repeats: true,
                every: 'day'
              },
              smallIcon: 'ic_stat_name',
              sound: 'default'
            }
          ]
        })
      } else {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] })
      }

      // 2. Invoice Due Date Reminder (ID 1002)
      if (settings.invoiceReminderEnabled && creditCardDueDay) {
        const now = new Date()
        let invoiceDate = new Date(now.getFullYear(), now.getMonth(), creditCardDueDay, 9, 0, 0)
        
        // Notify 2 days before due date
        invoiceDate.setDate(invoiceDate.getDate() - 2)
        if (invoiceDate.getTime() <= now.getTime()) {
          invoiceDate = new Date(now.getFullYear(), now.getMonth() + 1, creditCardDueDay, 9, 0, 0)
          invoiceDate.setDate(invoiceDate.getDate() - 2)
        }

        await LocalNotifications.cancel({ notifications: [{ id: 1002 }] })
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1002,
              title: 'Lembrete de Fatura 💳',
              body: `Sua fatura de cartão vence em 2 dias (dia ${creditCardDueDay}). Lembre-se de conferir seu saldo em conta!`,
              schedule: {
                at: invoiceDate,
                repeats: true,
                every: 'month'
              },
              sound: 'default'
            }
          ]
        })
      } else {
        await LocalNotifications.cancel({ notifications: [{ id: 1002 }] })
      }
    }
  } catch (err) {
    console.warn('Erro ao agendar notificações locais:', err)
  }
}

/**
 * Trigger immediate test notification to demonstrate functionality
 */
export async function triggerTestNotification(settings) {
  try {
    const hasPermission = await checkNotificationPermissions()
    if (!hasPermission) {
      const granted = await requestNotificationPermissions()
      if (!granted) {
        alert('Permissão de notificações não concedida nas configurações do dispositivo.')
        return false
      }
    }

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: 'Gestor Financeiro 🔔',
            body: `Teste de notificação com sucesso! Lembrete diário configurado para as ${settings?.dailyReminderTime || '21:00'}.`,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default'
          }
        ]
      })
      return true
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Gestor Financeiro 🔔', {
        body: `Teste de notificação com sucesso! Lembrete diário configurado para as ${settings?.dailyReminderTime || '21:00'}.`,
        icon: '/favicon.ico'
      })
      return true
    } else {
      alert(`[Demonstração] Lembrete do Gestor Financeiro:\n\nNotificação configurada com sucesso para as ${settings?.dailyReminderTime || '21:00'}!`)
      return true
    }
  } catch (err) {
    console.error('Erro ao disparar notificação de teste:', err)
    alert('Erro ao disparar notificação: ' + err.message)
    return false
  }
}
