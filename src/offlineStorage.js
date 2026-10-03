const ROOMS_KEY = 'campus_service_rooms'
const BOOKINGS_KEY = 'campus_service_bookings'
const PENDING_BOOKINGS_KEY = 'campus_service_pending_bookings'

export function saveRooms(rooms) {
  try {
    localStorage.setItem(
      ROOMS_KEY,
      JSON.stringify(rooms)
    )
  } catch (error) {
    console.error('Unable to cache rooms:', error)
  }
}

export function getCachedRooms() {
  try {
    const data = localStorage.getItem(ROOMS_KEY)

    return data
      ? JSON.parse(data)
      : []
  } catch (error) {
    console.error('Unable to read cached rooms:', error)
    return []
  }
}

export function saveBookings(bookings) {
  try {
    localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(bookings)
    )
  } catch (error) {
    console.error('Unable to cache bookings:', error)
  }
}

export function getCachedBookings() {
  try {
    const data =
      localStorage.getItem(BOOKINGS_KEY)

    return data
      ? JSON.parse(data)
      : []
  } catch (error) {
    console.error(
      'Unable to read cached bookings:',
      error
    )

    return []
  }
}

/* -------------------------------
   Offline Booking Queue
-------------------------------- */

export function savePendingBookings(bookings) {
  try {
    localStorage.setItem(
      PENDING_BOOKINGS_KEY,
      JSON.stringify(bookings)
    )
  } catch (error) {
    console.error(
      'Unable to save pending bookings:',
      error
    )
  }
}

export function getPendingBookings() {
  try {
    const data =
      localStorage.getItem(PENDING_BOOKINGS_KEY)

    return data
      ? JSON.parse(data)
      : []
  } catch (error) {
    console.error(
      'Unable to read pending bookings:',
      error
    )

    return []
  }
}

export function addPendingBooking(booking) {
  try {
    const existingBookings =
      getPendingBookings()

    existingBookings.push(booking)

    savePendingBookings(existingBookings)
  } catch (error) {
    console.error(
      'Unable to add pending booking:',
      error
    )
  }
}

export function clearPendingBookings() {
  try {
    localStorage.removeItem(
      PENDING_BOOKINGS_KEY
    )
  } catch (error) {
    console.error(
      'Unable to clear pending bookings:',
      error
    )
  }
}