const ROOMS_KEY = 'campus_service_rooms'
const BOOKINGS_KEY = 'campus_service_bookings'

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