import { useEffect, useState } from 'react'
import { client } from '../client'
import { getCurrentUser } from 'aws-amplify/auth'

import {
  saveRooms,
  getCachedRooms,
  saveBookings,
  getCachedBookings,
  addPendingBooking,
  getPendingBookings,
  clearPendingBookings,
} from '../offlineStorage'

function StudentDashboard({ user, signOut }) {
  const [requests, setRequests] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])

  const [activePage, setActivePage] = useState('dashboard')

  // Service Request
  const [serviceType, setServiceType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Room Booking
  const [selectedRoom, setSelectedRoom] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [announcementLoading, setAnnouncementLoading] = useState(true)
  const [roomLoading, setRoomLoading] = useState(true)

  const [isOnline, setIsOnline] = useState(
    navigator.onLine
  )

  // =========================================
  // LOAD SERVICE REQUESTS
  // =========================================

  async function loadRequests() {
    try {
      if (!navigator.onLine) {
        return
      }

      const { data, errors } =
        await client.models.ServiceRequest.list()

      if (errors) {
        console.error(errors)
        return
      }

      setRequests(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  // =========================================
  // LOAD ANNOUNCEMENTS
  // =========================================

  async function loadAnnouncements() {
    setAnnouncementLoading(true)

    try {
      if (!navigator.onLine) {
        return
      }

      const { data, errors } =
        await client.models.Announcement.list()

      if (errors) {
        console.error(errors)
        return
      }

      const sortedAnnouncements = [...(data || [])].sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      )

      setAnnouncements(sortedAnnouncements)
    } catch (error) {
      console.error(error)
    } finally {
      setAnnouncementLoading(false)
    }
  }

  // =========================================
  // LOAD ROOMS
  // =========================================

  async function loadRooms() {
    setRoomLoading(true)

    try {
      if (!navigator.onLine) {
        const cachedRooms = getCachedRooms()
        setRooms(cachedRooms)
        return
      }

      const { data, errors } =
        await client.models.Room.list()

      if (errors) {
        console.error(errors)

        const cachedRooms = getCachedRooms()
        setRooms(cachedRooms)

        return
      }

      const roomData = data || []

      setRooms(roomData)
      saveRooms(roomData)
    } catch (error) {
      console.error(error)

      const cachedRooms = getCachedRooms()
      setRooms(cachedRooms)
    } finally {
      setRoomLoading(false)
    }
  }

  // =========================================
  // LOAD BOOKINGS
  // =========================================

  async function loadBookings() {
    try {
      if (!navigator.onLine) {
        const cachedBookings = getCachedBookings()
        setBookings(cachedBookings)
        return
      }

      const { data, errors } =
        await client.models.Booking.list()

      if (errors) {
        console.error(errors)

        const cachedBookings = getCachedBookings()
        setBookings(cachedBookings)

        return
      }

      const bookingData = data || []

      setBookings(bookingData)
      saveBookings(bookingData)
    } catch (error) {
      console.error(error)

      const cachedBookings = getCachedBookings()
      setBookings(cachedBookings)
    }
  }

  // =========================================
  // SYNC OFFLINE BOOKINGS
  // =========================================

  async function syncPendingBookings() {
    if (!navigator.onLine) {
      return
    }

    const pendingBookings =
      getPendingBookings()

    if (pendingBookings.length === 0) {
      return
    }

    console.log(
      `Syncing ${pendingBookings.length} offline booking(s)...`
    )

    const remainingBookings = []

    for (const booking of pendingBookings) {
      try {
        const bookingData = {
          roomId: booking.roomId,
          roomNumber: booking.roomNumber,
          studentEmail: booking.studentEmail,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
        }

        const { data, errors } =
          await client.models.Booking.create(
            bookingData
          )

        if (errors) {
          console.error(
            'Unable to sync booking:',
            errors
          )

          remainingBookings.push(booking)
          continue
        }

        console.log(
          'Offline booking synced:',
          data
        )
      } catch (error) {
        console.error(
          'Error syncing offline booking:',
          error
        )

        remainingBookings.push(booking)
      }
    }

    if (remainingBookings.length === 0) {
      clearPendingBookings()
    } else {
      localStorage.setItem(
        'campus_service_pending_bookings',
        JSON.stringify(remainingBookings)
      )
    }

    await loadBookings()
  }

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadRequests()
    loadAnnouncements()
    loadRooms()
    loadBookings()

    if (navigator.onLine) {
      syncPendingBookings()
    }
  }, [])

  // =========================================
  // ONLINE / OFFLINE LISTENER
  // =========================================

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)

      loadRooms()
      loadBookings()
      loadRequests()
      loadAnnouncements()

      syncPendingBookings()
    }

    function handleOffline() {
      setIsOnline(false)

      const cachedRooms = getCachedRooms()
      const cachedBookings = getCachedBookings()

      setRooms(cachedRooms)
      setBookings(cachedBookings)
    }

    window.addEventListener(
      'online',
      handleOnline
    )

    window.addEventListener(
      'offline',
      handleOffline
    )

    return () => {
      window.removeEventListener(
        'online',
        handleOnline
      )

      window.removeEventListener(
        'offline',
        handleOffline
      )
    }
  }, [])

  // =========================================
  // CREATE SERVICE REQUEST
  // =========================================

  async function createRequest(event) {
    event.preventDefault()

    if (!serviceType || !title || !description) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)

    try {
      const currentUser =
        await getCurrentUser()

      const { errors } =
        await client.models.ServiceRequest.create({
          studentEmail:
            currentUser.signInDetails?.loginId ||
            currentUser.username,

          serviceType,
          title,
          description,
          status: 'Pending',
        })

      if (errors) {
        console.error(errors)
        alert('Failed to submit request')
        return
      }

      alert(
        'Service request submitted successfully!'
      )

      setServiceType('')
      setTitle('')
      setDescription('')

      await loadRequests()

      setActivePage('requests')
    } catch (error) {
      console.error(error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // =========================================
  // CREATE ROOM BOOKING
  // =========================================

  async function createBooking(event) {
    event.preventDefault()

    if (
      !selectedRoom ||
      !bookingDate ||
      !startTime ||
      !endTime
    ) {
      alert('Please fill all booking fields')
      return
    }

    if (startTime >= endTime) {
      alert(
        'End time must be after start time'
      )
      return
    }

    setBookingLoading(true)

    try {
      const currentUser =
        await getCurrentUser()

      const room = rooms.find(
        (item) => item.id === selectedRoom
      )

      if (!room) {
        alert('Selected room was not found')
        return
      }

      // =========================================
      // BASIC CLIENT-SIDE CONFLICT CHECK
      // =========================================

      const conflict = bookings.some(
        (booking) =>
          booking.roomId === room.id &&
          booking.date === bookingDate &&
          booking.status !== 'Cancelled' &&
          startTime < booking.endTime &&
          endTime > booking.startTime
      )

      if (conflict) {
        alert(
          'This room is already booked for the selected time.'
        )
        return
      }

      const studentEmail =
        currentUser.signInDetails?.loginId ||
        currentUser.username

      const bookingData = {
        roomId: room.id,
        roomNumber: room.roomNumber,
        studentEmail,
        date: bookingDate,
        startTime,
        endTime,
        status: 'Confirmed',
      }

      // =========================================
      // OFFLINE BOOKING
      // =========================================

      if (!navigator.onLine) {
        const offlineBooking = {
          ...bookingData,
          id: `offline-${Date.now()}`,
          offline: true,
        }

        addPendingBooking(
          offlineBooking
        )

        setBookings(
          (currentBookings) => [
            ...currentBookings,
            offlineBooking,
          ]
        )

        alert(
          'You are offline. Booking saved and will sync when internet returns.'
        )

        setSelectedRoom('')
        setBookingDate('')
        setStartTime('')
        setEndTime('')

        setActivePage('bookings')

        return
      }

      // =========================================
      // ONLINE BOOKING
      // =========================================

      const { data, errors } =
        await client.models.Booking.create(
          bookingData
        )

      if (errors) {
        console.error(errors)
        alert('Failed to create booking')
        return
      }

      if (data) {
        setBookings(
          (currentBookings) => [
            ...currentBookings,
            data,
          ]
        )
      }

      alert('Room booked successfully!')

      setSelectedRoom('')
      setBookingDate('')
      setStartTime('')
      setEndTime('')

      await loadBookings()

      setActivePage('bookings')
    } catch (error) {
      console.error(error)

      alert(
        'Something went wrong while booking'
      )
    } finally {
      setBookingLoading(false)
    }
  }

  // =========================================
  // STATUS CLASS
  // =========================================

  function getStatusClass(status) {
    if (
      status === 'Resolved' ||
      status === 'Confirmed'
    ) {
      return 'student-status resolved'
    }

    if (
      status === 'In Progress' ||
      status === 'Pending'
    ) {
      return 'student-status progress'
    }

    return 'student-status pending'
  }

  // =========================================
  // REQUEST ICON
  // =========================================

  function getRequestIcon(serviceType) {
    if (serviceType === 'IT Support') return '📶'
    if (serviceType === 'Hostel') return '🛏️'
    if (serviceType === 'Library') return '📚'
    if (serviceType === 'Transport') return '🚌'
    if (serviceType === 'Academic') return '🎓'

    return '📋'
  }

  // =========================================
  // NAVIGATION
  // =========================================

  function openPage(page) {
    setActivePage(page)
  }

  // =========================================
  // STATISTICS
  // =========================================

  const totalRequests =
    requests.length

  const pendingRequests =
    requests.filter(
      (request) =>
        request.status === 'Pending'
    ).length

  const inProgressRequests =
    requests.filter(
      (request) =>
        request.status === 'In Progress'
    ).length

  const resolvedRequests =
    requests.filter(
      (request) =>
        request.status === 'Resolved'
    ).length

  const recentRequests =
    [...requests]
      .reverse()
      .slice(0, 3)

  const today =
    new Date()
      .toISOString()
      .split('T')[0]

  return (
    <div className="student-app">

      {/* =================================
          TOP BAR
      ================================= */}

      <header className="student-topbar">

        <div className="student-brand">

          <div className="brand-icon">
            🏫
          </div>

          <div>
            <h1>Campus Service</h1>
            <span>Student Portal</span>
          </div>

        </div>

        <div className="student-account">

          <div
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              background: isOnline
                ? '#dcfce7'
                : '#fee2e2',
              color: isOnline
                ? '#166534'
                : '#991b1b',
            }}
          >
            {isOnline
              ? '🟢 Online'
              : '🔴 Offline'}
          </div>

          <div className="student-account-info">

            <strong>
              {user?.signInDetails?.loginId}
            </strong>

            <span>
              Student
            </span>

          </div>

          <button
            className="student-signout"
            onClick={signOut}
          >
            Sign Out
          </button>

        </div>

      </header>


      {/* =================================
          MAIN LAYOUT
      ================================= */}

      <div className="student-layout">

        {/* =================================
            SIDEBAR
        ================================= */}

        <aside className="student-sidebar">

          <nav>

            <button
              className={`student-nav ${
                activePage === 'dashboard'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                openPage('dashboard')
              }
            >
              🏠
              <span>Dashboard</span>
            </button>

            <button
              className={`student-nav ${
                activePage === 'new'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                openPage('new')
              }
            >
              ➕
              <span>New Request</span>
            </button>

            <button
              className={`student-nav ${
                activePage === 'requests'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                openPage('requests')
              }
            >
              📋
              <span>My Requests</span>
            </button>

            <button
              className={`student-nav ${
                activePage === 'booking'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                openPage('booking')
              }
            >
              🏫
              <span>Book Room</span>
            </button>

            <button
              className={`student-nav ${
                activePage === 'bookings'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                openPage('bookings')
              }
            >
              📅
              <span>My Bookings</span>
            </button>

            <button
              className={`student-nav ${
                activePage === 'announcements'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                openPage('announcements')
              }
            >
              📢
              <span>Announcements</span>
            </button>

          </nav>

        </aside>


        {/* =================================
            CONTENT
        ================================= */}

        <main className="student-content">

          {/* =================================
              DASHBOARD
          ================================= */}

          {activePage === 'dashboard' && (

            <>

              <section className="student-welcome">

                <div>

                  <h2>
                    Welcome back! 👋
                  </h2>

                  <p>
                    Here's an overview of your campus
                    service activity.
                  </p>

                </div>

                <div className="welcome-icon">
                  🏫
                </div>

              </section>


              <section className="student-statistics">

                <div className="student-stat-card">

                  <div className="student-stat-icon blue">
                    📋
                  </div>

                  <div>
                    <span>
                      Total Requests
                    </span>

                    <strong>
                      {totalRequests}
                    </strong>
                  </div>

                </div>


                <div className="student-stat-card">

                  <div className="student-stat-icon orange">
                    ⏳
                  </div>

                  <div>
                    <span>
                      Pending
                    </span>

                    <strong>
                      {pendingRequests}
                    </strong>
                  </div>

                </div>


                <div className="student-stat-card">

                  <div className="student-stat-icon purple">
                    🔄
                  </div>

                  <div>
                    <span>
                      In Progress
                    </span>

                    <strong>
                      {inProgressRequests}
                    </strong>
                  </div>

                </div>


                <div className="student-stat-card">

                  <div className="student-stat-icon green">
                    ✅
                  </div>

                  <div>
                    <span>
                      Resolved
                    </span>

                    <strong>
                      {resolvedRequests}
                    </strong>
                  </div>

                </div>

              </section>


              <div className="student-dashboard-grid">

                {/* RECENT REQUESTS */}

                <section className="student-card">

                  <div className="student-card-heading">

                    <div className="card-icon green">
                      📋
                    </div>

                    <div>

                      <h2>
                        Recent Requests
                      </h2>

                      <p>
                        Your latest service requests.
                      </p>

                    </div>

                  </div>


                  {recentRequests.length === 0 ? (

                    <div className="student-empty">

                      <h3>
                        No requests yet
                      </h3>

                      <p>
                        Submit your first service request.
                      </p>

                    </div>

                  ) : (

                    <div className="student-request-list">

                      {recentRequests.map(
                        (request) => (

                          <article
                            className="student-request"
                            key={request.id}
                          >

                            <div className="request-icon">
                              {getRequestIcon(
                                request.serviceType
                              )}
                            </div>

                            <div className="request-info">

                              <div className="request-title-row">

                                <h3>
                                  {request.title}
                                </h3>

                                <span
                                  className={getStatusClass(
                                    request.status
                                  )}
                                >
                                  {request.status}
                                </span>

                              </div>

                              <span className="request-service">
                                {request.serviceType}
                              </span>

                            </div>

                          </article>

                        )
                      )}

                    </div>

                  )}

                </section>


                {/* BOOKING SUMMARY */}

                <section className="student-card">

                  <div className="student-card-heading">

                    <div className="card-icon blue">
                      🏫
                    </div>

                    <div>

                      <h2>
                        Room Booking
                      </h2>

                      <p>
                        Book a campus room quickly.
                      </p>

                    </div>

                  </div>

                  <div className="student-empty">

                    <div className="announcement-empty-icon">
                      🏫
                    </div>

                    <h3>
                      {rooms.length} Rooms Available
                    </h3>

                    <p>
                      Reserve a room for your campus activity.
                    </p>

                    <button
                      className="student-submit"
                      onClick={() =>
                        openPage('booking')
                      }
                    >
                      Book a Room →
                    </button>

                  </div>

                </section>

              </div>


              {/* QUICK ACTIONS */}

              <section className="student-quick-actions">

                <h2>
                  Quick Actions
                </h2>

                <div className="student-quick-grid">

                  <button
                    onClick={() =>
                      openPage('new')
                    }
                  >
                    <span>➕</span>

                    <strong>
                      New Service Request
                    </strong>

                    <small>
                      Submit a new campus request
                    </small>

                  </button>


                  <button
                    onClick={() =>
                      openPage('booking')
                    }
                  >
                    <span>🏫</span>

                    <strong>
                      Book a Room
                    </strong>

                    <small>
                      Reserve a campus room
                    </small>

                  </button>


                  <button
                    onClick={() =>
                      openPage('bookings')
                    }
                  >
                    <span>📅</span>

                    <strong>
                      My Bookings
                    </strong>

                    <small>
                      View your room bookings
                    </small>

                  </button>

                </div>

              </section>

            </>

          )}


          {/* =================================
              NEW SERVICE REQUEST
          ================================= */}

          {activePage === 'new' && (

            <section className="student-card student-page-card">

              <div className="student-card-heading">

                <div className="card-icon blue">
                  📝
                </div>

                <div>

                  <h2>
                    New Service Request
                  </h2>

                  <p>
                    Submit a new request to the campus administration.
                  </p>

                </div>

              </div>


              <form onSubmit={createRequest}>

                <div className="student-form-group">

                  <label>
                    Service Type
                  </label>

                  <select
                    value={serviceType}
                    onChange={(event) =>
                      setServiceType(
                        event.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      Select a service
                    </option>

                    <option value="Hostel">
                      Hostel
                    </option>

                    <option value="IT Support">
                      IT Support
                    </option>

                    <option value="Library">
                      Library
                    </option>

                    <option value="Transport">
                      Transport
                    </option>

                    <option value="Academic">
                      Academic
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>


                <div className="student-form-group">

                  <label>
                    Request Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) =>
                      setTitle(
                        event.target.value
                      )
                    }
                    placeholder="Example: WiFi not working"
                    required
                  />

                </div>


                <div className="student-form-group">

                  <label>
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    placeholder="Describe your issue clearly..."
                    rows="7"
                    required
                  />

                </div>


                <button
                  type="submit"
                  className="student-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Submitting...'
                    : '➤  Submit Request'}
                </button>

              </form>

            </section>

          )}


          {/* =================================
              MY REQUESTS
          ================================= */}

          {activePage === 'requests' && (

            <section className="student-card student-page-card">

              <div className="student-card-heading">

                <div className="card-icon green">
                  📋
                </div>

                <div>

                  <h2>
                    My Service Requests
                  </h2>

                  <p>
                    Track all your submitted requests.
                  </p>

                </div>

              </div>


              {requests.length === 0 ? (

                <div className="student-empty">

                  <h3>
                    No requests yet
                  </h3>

                  <p>
                    You haven't submitted any service requests.
                  </p>

                </div>

              ) : (

                <div className="student-request-list">

                  {requests.map(
                    (request) => (

                      <article
                        className="student-request"
                        key={request.id}
                      >

                        <div className="request-icon">
                          {getRequestIcon(
                            request.serviceType
                          )}
                        </div>

                        <div className="request-info">

                          <div className="request-title-row">

                            <h3>
                              {request.title}
                            </h3>

                            <span
                              className={getStatusClass(
                                request.status
                              )}
                            >
                              {request.status}
                            </span>

                          </div>

                          <span className="request-service">
                            {request.serviceType}
                          </span>

                          <p>
                            {request.description}
                          </p>

                        </div>

                      </article>

                    )
                  )}

                </div>

              )}

            </section>

          )}


          {/* =================================
              BOOK ROOM
          ================================= */}

          {activePage === 'booking' && (

            <section className="student-card student-page-card">

              <div className="student-card-heading">

                <div className="card-icon blue">
                  🏫
                </div>

                <div>

                  <h2>
                    Book a Campus Room
                  </h2>

                  <p>
                    Select a room, date and time for your booking.
                  </p>

                </div>

              </div>


              {!isOnline && (

                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#fff7ed',
                    color: '#9a3412',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  🔴 You are offline. Room bookings will be
                  saved locally and synced when you reconnect.
                </div>

              )}


              {roomLoading ? (

                <div className="student-empty">

                  <h3>
                    Loading rooms...
                  </h3>

                </div>

              ) : rooms.length === 0 ? (

                <div className="student-empty">

                  <div className="announcement-empty-icon">
                    🏫
                  </div>

                  <h3>
                    No rooms available
                  </h3>

                  <p>
                    Please contact the administrator.
                  </p>

                </div>

              ) : (

                <form onSubmit={createBooking}>

                  <div className="student-form-group">

                    <label>
                      Select Room
                    </label>

                    <select
                      value={selectedRoom}
                      onChange={(event) =>
                        setSelectedRoom(
                          event.target.value
                        )
                      }
                      required
                    >

                      <option value="">
                        Choose a room
                      </option>

                      {rooms.map(
                        (room) => (

                          <option
                            key={room.id}
                            value={room.id}
                          >
                            {room.roomNumber}
                            {' — '}
                            {room.building}
                            {' '}
                            ({room.roomType},{' '}
                            {room.capacity} seats)
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="student-form-group">

                    <label>
                      Booking Date
                    </label>

                    <input
                      type="date"
                      value={bookingDate}
                      min={today}
                      onChange={(event) =>
                        setBookingDate(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>


                  <div className="student-form-group">

                    <label>
                      Start Time
                    </label>

                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) =>
                        setStartTime(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>


                  <div className="student-form-group">

                    <label>
                      End Time
                    </label>

                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) =>
                        setEndTime(
                          event.target.value
                        )
                      }
                      required
                    />

                  </div>


                  <button
                    type="submit"
                    className="student-submit"
                    disabled={bookingLoading}
                  >
                    {bookingLoading
                      ? 'Booking...'
                      : isOnline
                        ? '🏫  Confirm Room Booking'
                        : '📴  Save Offline Booking'}
                  </button>

                </form>

              )}

            </section>

          )}


          {/* =================================
              MY BOOKINGS
          ================================= */}

          {activePage === 'bookings' && (

            <section className="student-card student-page-card">

              <div className="student-card-heading">

                <div className="card-icon green">
                  📅
                </div>

                <div>

                  <h2>
                    My Room Bookings
                  </h2>

                  <p>
                    View your campus room reservations.
                  </p>

                </div>

              </div>


              {bookings.length === 0 ? (

                <div className="student-empty">

                  <div className="announcement-empty-icon">
                    📅
                  </div>

                  <h3>
                    No bookings yet
                  </h3>

                  <p>
                    You haven't booked a campus room.
                  </p>

                  <button
                    className="student-submit"
                    onClick={() =>
                      openPage('booking')
                    }
                  >
                    Book a Room →
                  </button>

                </div>

              ) : (

                <div className="student-request-list">

                  {bookings.map(
                    (booking) => (

                      <article
                        className="student-request"
                        key={booking.id}
                      >

                        <div className="request-icon">
                          🏫
                        </div>

                        <div className="request-info">

                          <div className="request-title-row">

                            <h3>
                              {booking.roomNumber}
                            </h3>

                            <span
                              className={getStatusClass(
                                booking.status
                              )}
                            >
                              {booking.offline
                                ? 'Waiting for Sync'
                                : booking.status}
                            </span>

                          </div>

                          <span className="request-service">
                            📅 {booking.date}
                          </span>

                          <p>
                            🕐 {booking.startTime}
                            {' – '}
                            {booking.endTime}
                          </p>

                        </div>

                      </article>

                    )
                  )}

                </div>

              )}

            </section>

          )}


          {/* =================================
              ANNOUNCEMENTS
          ================================= */}

          {activePage === 'announcements' && (

            <section className="student-card student-page-card">

              <div className="student-card-heading">

                <div className="card-icon announcement-icon">
                  📢
                </div>

                <div>

                  <h2>
                    Campus Announcements
                  </h2>

                  <p>
                    Important updates from the campus administration.
                  </p>

                </div>

              </div>


              {announcementLoading ? (

                <div className="student-empty">

                  <h3>
                    Loading announcements...
                  </h3>

                </div>

              ) : announcements.length === 0 ? (

                <div className="student-empty">

                  <div className="announcement-empty-icon">
                    📭
                  </div>

                  <h3>
                    No announcements yet
                  </h3>

                  <p>
                    There are no new announcements from the administration.
                  </p>

                </div>

              ) : (

                <div className="student-announcement-list">

                  {announcements.map(
                    (announcement) => (

                      <article
                        className="student-announcement-card"
                        key={announcement.id}
                      >

                        <div className="student-announcement-icon">
                          📢
                        </div>

                        <div className="student-announcement-content">

                          <div className="student-announcement-top">

                            <h3>
                              {announcement.title}
                            </h3>

                            <span>
                              📅 {announcement.date}
                            </span>

                          </div>

                          <p>
                            {announcement.message}
                          </p>

                        </div>

                      </article>

                    )
                  )}

                </div>

              )}

            </section>

          )}

        </main>

      </div>

    </div>
  )
}

export default StudentDashboard