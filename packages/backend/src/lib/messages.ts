export type Race = 'chinese' | 'malay' | 'indian' | 'other'

export const waMessages = {
  invite_viewing: {
    chinese: (a: string) => `你好！我们很高兴通知您，屋主已确认。请问您什么时候方便来看 ${a} 这个单位？😊`,
    malay: (a: string) => `Hai! Kami dengan sukacitanya memaklumkan bahawa tuan rumah telah mengesahkan. Bilakah masa yang sesuai untuk anda melihat unit di ${a}? 😊`,
    indian: (a: string) => `Hi! We are pleased to inform you that the owner has confirmed. When would you be available to view the unit at ${a}? 😊`,
    other: (a: string) => `Hi! We are pleased to inform you that the owner has confirmed. When would you be available to view the unit at ${a}? 😊`,
  },
  viewing_reminder: {
    chinese: () => `你好！提醒您今天我们有看房安排，期待见到您！😊`,
    malay: () => `Hai! Sekadar mengingatkan bahawa kita ada temu janji untuk melihat rumah hari ini. Jumpa nanti! 😊`,
    indian: () => `Hi, see you later 😊`,
    other: () => `Hi, see you later 😊`,
  },
  post_viewing: {
    chinese: (a: string) => `你好！上次我们一起参观了 ${a}，请问您对这个房间满意吗？😊`,
    malay: (a: string) => `Hai! Kita telah melihat rumah di ${a} baru-baru ini. Adakah anda berpuas hati dengan rumah tersebut? 😊`,
    indian: (a: string) => `Hi, last time we have viewed the house at ${a}, are you satisfied with it? 😊`,
    other: (a: string) => `Hi, last time we have viewed the house at ${a}, are you satisfied with it? 😊`,
  },
  ask_move_in: {
    chinese: () => `你好！请问您打算什么时候搬入？😊`,
    malay: () => `Hai! Boleh saya tahu bilakah anda merancang untuk berpindah masuk? 😊`,
    indian: () => `Hi may I know when are you going to move in？😊`,
    other: () => `Hi may I know when are you going to move in？😊`,
  },
  move_in_reminder: {
    chinese: () => `你好！提醒您今天是您的搬入日期，期待您的入住！😊`,
    malay: () => `Hai! Sekadar mengingatkan bahawa hari ini adalah tarikh pindah masuk anda. Jumpa nanti! 😊`,
    indian: () => `Hi, see you later 😊`,
    other: () => `Hi, see you later 😊`,
  },
  pay_rent: {
    chinese: () => `你好！温馨提醒，请发送本月房租收据，谢谢！😊`,
    malay: () => `Hai! Sekadar peringatan mesra, sila hantar resit bayaran sewa bulan ini. Terima kasih! 😊`,
    indian: () => `Hi, kindly reminder，please send receipt for room rental fee😊`,
    other: () => `Hi, kindly reminder，please send receipt for room rental fee😊`,
  },
  room_no_longer_available: {
    chinese: (a: string) => `您好！非常抱歉，${a} 的房间已经被预订了。请问您有兴趣了解其他房间吗？`,
    malay: (a: string) => `Hai! Maaf, rumah di ${a} sudah tidak tersedia. Adakah anda berminat dengan rumah lain?`,
    indian: (a: string) => `Sorry, the room at ${a} is no longer available, are you interested in another one?`,
    other: (a: string) => `Sorry, the room at ${a} is no longer available, are you interested in another one?`,
  },
}

export function buildWaLink(phone: string, message: string): string {
  let n = phone.replace(/[\s\-\(\)]/g, '')
  if (n.startsWith('0')) n = '60' + n.slice(1)
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`
}

export function getWaMessage(status: string, race: Race, address: string, hasMoveInDate?: boolean): string | null {
  switch (status) {
    case 'new_customer': return null
    case 'owner_confirmed': return waMessages.invite_viewing[race]?.(address) ?? waMessages.invite_viewing.other(address)
    case 'viewing_scheduled': return waMessages.viewing_reminder[race]?.() ?? waMessages.viewing_reminder.other()
    case 'viewing_done': return waMessages.post_viewing[race]?.(address) ?? waMessages.post_viewing.other(address)
    case 'booked': case 'paid':
      return hasMoveInDate
        ? (waMessages.move_in_reminder[race]?.() ?? waMessages.move_in_reminder.other())
        : (waMessages.ask_move_in[race]?.() ?? waMessages.ask_move_in.other())
    case 'moved_in': return waMessages.pay_rent[race]?.() ?? waMessages.pay_rent.other()
    default: return null
  }
}
