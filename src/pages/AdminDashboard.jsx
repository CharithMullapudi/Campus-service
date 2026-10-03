import { useEffect, useState } from 'react'
import { client } from '../client'

function AdminDashboard({ user, signOut }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  // Announcement states
  const [announcements, setAnnouncements] = useState([])
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementDate, setAnnouncementDate] = useState('')
  const [announcementLoading, setAnnouncementLoading] = useState(false)

  // Room states
  const [rooms, setRooms] = useState([])
  const [roomNumber, setRoomNumber] = useState('')
  const [building, setBuilding] = useState('')
  const [capacity, setCapacity] = useState('')
  const [roomType, setRoomType] = useState('')
  const [roomLoading, setRoomLoading] = useState(false)

  // Booking states
  const [bookings, setBookings] = useState([])
  const [bookingLoading, setBookingLoading] = useState(true)

  // =========================================
  // LOAD SERVICE REQUESTS
  // =========================================

  async function loadRequests() {
    setLoading(true)

    try {
      const { data, errors } =
        await client.models.ServiceRequest.list()

      if (errors) {
        console.error(errors)
        alert('Unable to load service requests')
        return
      }

      setRequests(data || [])
    } catch (error) {
      console.error(error)
      alert('Something went wrong while loading requests')
    } finally {
      setLoading(false)
    }
  }

  // =========================================
  // LOAD ANNOUNCEMENTS
  // =========================================

  async function loadAnnouncements() {
    try {
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
    }
  }

  // =========================================
  // LOAD ROOMS
  // =========================================

  async function loadRooms() {
    try {
      const { data, errors } =
        await client.models.Room.list()

      if (errors) {
        console.error(errors)
        return
      }

      setRooms(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  // =========================================
  // LOAD BOOKINGS
  // =========================================

  async function loadBookings() {
    setBookingLoading(true)

    try {
      const { data, errors } =
        await client.models.Booking.list()

      if (errors) {
        console.error(errors)
        return
      }

      const sortedBookings = [...(data || [])].sort(
        (a, b) => {
          const first = `${a.date} ${a.startTime}`
          const second = `${b.date} ${b.startTime}`

          return second.localeCompare(first)
        }
      )

      setBookings(sortedBookings)
    } catch (error) {
      console.error(error)
    } finally {
      setBookingLoading(false)
    }
  }

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadRequests()
    loadAnnouncements()
    loadRooms()
    loadBookings()
  }, [])

  // =========================================
  // UPDATE REQUEST STATUS
  // =========================================

  async function updateStatus(id, status) {
    try {
      const { errors } =
        await client.models.ServiceRequest.update({
          id,
          status,
        })

      if (errors) {
        console.error(errors)
        alert('Unable to update request status')
        return
      }

      await loadRequests()
    } catch (error) {
      console.error(error)
      alert('Something went wrong while updating status')
    }
  }

  // =========================================
  // CREATE ANNOUNCEMENT
  // =========================================

  async function createAnnouncement(event) {
    event.preventDefault()

    if (
      !announcementTitle.trim() ||
      !announcementMessage.trim() ||
      !announcementDate
    ) {
      alert('Please fill all announcement fields')
      return
    }

    setAnnouncementLoading(true)

    try {
      const { errors } =
        await client.models.Announcement.create({
          title: announcementTitle.trim(),
          message: announcementMessage.trim(),
          date: announcementDate,
        })

      if (errors) {
        console.error(errors)
        alert('Unable to publish announcement')
        return
      }

      setAnnouncementTitle('')
      setAnnouncementMessage('')
      setAnnouncementDate('')

      await loadAnnouncements()

      alert('Announcement published successfully!')
    } catch (error) {
      console.error(error)
      alert('Something went wrong while publishing')
    } finally {
      setAnnouncementLoading(false)
    }
  }

  // =========================================
  // CREATE ROOM
  // =========================================

  async function createRoom(event) {
    event.preventDefault()

    if (
      !roomNumber.trim() ||
      !building.trim() ||
      !capacity ||
      !roomType
    ) {
      alert('Please fill all room fields')
      return
    }

    if (Number(capacity) <= 0) {
      alert('Capacity must be greater than 0')
      return
    }

    // Prevent duplicate room numbers
    const duplicateRoom = rooms.some(
      (room) =>
        room.roomNumber.toLowerCase() ===
        roomNumber.trim().toLowerCase()
    )

    if (duplicateRoom) {
      alert('A room with this room number already exists')
      return
    }

    setRoomLoading(true)

    try {
      const { errors } =
        await client.models.Room.create({
          roomNumber: roomNumber.trim(),
          building: building.trim(),
          capacity: Number(capacity),
          roomType,
        })

      if (errors) {
        console.error(errors)
        alert('Unable to create room')
        return
      }

      setRoomNumber('')
      setBuilding('')
      setCapacity('')
      setRoomType('')

      await loadRooms()

      alert('Room created successfully!')
    } catch (error) {
      console.error(error)
      alert('Something went wrong while creating room')
    } finally {
      setRoomLoading(false)
    }
  }

  // =========================================
  // UPDATE BOOKING STATUS
  // =========================================

  async function updateBookingStatus(id, status) {
    try {
      const { errors } =
        await client.models.Booking.update({
          id,
          status,
        })

      if (errors) {
        console.error(errors)
        alert('Unable to update booking')
        return
      }

      await loadBookings()

      alert(
        status === 'Cancelled'
          ? 'Booking cancelled successfully'
          : 'Booking confirmed successfully'
      )
    } catch (error) {
      console.error(error)
      alert('Something went wrong while updating booking')
    }
  }

  // =========================================
  // STATISTICS
  // =========================================

  const totalRequests = requests.length

  const pendingRequests = requests.filter(
    (request) => request.status === 'Pending'
  ).length

  const inProgressRequests = requests.filter(
    (request) => request.status === 'In Progress'
  ).length

  const resolvedRequests = requests.filter(
    (request) => request.status === 'Resolved'
  ).length

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === 'Confirmed'
  ).length

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === 'Cancelled'
  ).length

  // =========================================
  // RECENT DATA
  // =========================================

  const recentRequests = [...requests]
    .reverse()
    .slice(0, 3)

  const latestAnnouncements =
    announcements.slice(0, 3)

  // =========================================
  // FILTER REQUESTS
  // =========================================

  const filteredRequests =
    filter === 'All'
      ? requests
      : requests.filter(
          (request) => request.status === filter
        )

  // =========================================
  // STATUS CLASS
  // =========================================

  function getStatusClass(status) {
    if (
      status === 'Resolved' ||
      status === 'Confirmed'
    ) {
      return 'admin-status resolved'
    }

    if (
      status === 'In Progress' ||
      status === 'Pending'
    ) {
      return 'admin-status progress'
    }

    return 'admin-status pending'
  }

  // =========================================
  // REQUEST ICON
  // =========================================

  function getRequestIcon(serviceType) {
    if (serviceType === 'IT Support') {
      return '📶'
    }

    if (serviceType === 'Hostel') {
      return '🛏️'
    }

    if (serviceType === 'Library') {
      return '📚'
    }

    if (serviceType === 'Transport') {
      return '🚌'
    }

    if (serviceType === 'Academic') {
      return '🎓'
    }

    return '📋'
  }

  // =========================================
  // FORMAT ANNOUNCEMENT DATE
  // =========================================

  function formatAnnouncementDate(date) {
    if (!date) {
      return ''
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  // =========================================
  // FORMAT BOOKING DATE
  // =========================================

  function formatBookingDate(date) {
    if (!date) {
      return ''
    }

    const parsedDate = new Date(`${date}T00:00:00`)

    if (Number.isNaN(parsedDate.getTime())) {
      return date
    }

    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  return (
    <div className="admin-dashboard">

      {/* =================================
          HEADER
      ================================= */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-brand-icon">
            🏫
          </div>

          <div>
            <h1>Campus Service</h1>
            <span>Administration Portal</span>
          </div>

        </div>

        <div className="admin-account">

          <div className="admin-account-info">

            <strong>
              {user?.signInDetails?.loginId}
            </strong>

            <span>
              Administrator
            </span>

          </div>

          <button
            className="admin-signout"
            onClick={signOut}
          >
            Sign Out
          </button>

        </div>

      </header>


      {/* =================================
          MAIN CONTENT
      ================================= */}

      <main className="admin-main">

        {/* =================================
            WELCOME
        ================================= */}

        <section className="admin-welcome">

          <div>

            <h2>
              Welcome back, Administrator 👋
            </h2>

            <p>
              Manage campus rooms, bookings,
              service requests and announcements.
            </p>

          </div>

          <div className="admin-welcome-icon">
            🛡️
          </div>

        </section>


        {/* =================================
            STATISTICS
        ================================= */}

        <section className="admin-statistics">

          <div className="admin-stat-card">

            <div className="admin-stat-icon blue">
              📋
            </div>

            <div>
              <span>Total Requests</span>
              <strong>{totalRequests}</strong>
            </div>

          </div>


          <div className="admin-stat-card">

            <div className="admin-stat-icon orange">
              ⏳
            </div>

            <div>
              <span>Pending</span>
              <strong>{pendingRequests}</strong>
            </div>

          </div>


          <div className="admin-stat-card">

            <div className="admin-stat-icon purple">
              🔄
            </div>

            <div>
              <span>In Progress</span>
              <strong>{inProgressRequests}</strong>
            </div>

          </div>


          <div className="admin-stat-card">

            <div className="admin-stat-icon green">
              🏫
            </div>

            <div>
              <span>Rooms</span>
              <strong>{rooms.length}</strong>
            </div>

          </div>

        </section>


        {/* =================================
            ADMIN OVERVIEW
        ================================= */}

        <div className="admin-overview-grid">

          {/* RECENT REQUESTS */}

          <section className="admin-card">

            <div className="admin-section-heading">

              <div className="admin-section-icon blue-icon">
                📋
              </div>

              <div>

                <h2>
                  Recent Requests
                </h2>

                <p>
                  Latest requests submitted by students.
                </p>

              </div>

            </div>


            {recentRequests.length === 0 ? (

              <div className="admin-empty">

                <div className="admin-empty-icon">
                  📭
                </div>

                <h3>
                  No requests yet
                </h3>

                <p>
                  Student requests will appear here.
                </p>

              </div>

            ) : (

              <div className="admin-recent-list">

                {recentRequests.map((request) => (

                  <article
                    className="admin-recent-request"
                    key={request.id}
                  >

                    <div className="admin-recent-icon">
                      {getRequestIcon(
                        request.serviceType
                      )}
                    </div>

                    <div className="admin-recent-content">

                      <div className="admin-recent-top">

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

                      <span>
                        {request.serviceType}
                      </span>

                      <p>
                        {request.studentEmail}
                      </p>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </section>


          {/* LATEST ANNOUNCEMENTS */}

          <section className="admin-card">

            <div className="admin-section-heading">

              <div className="admin-section-icon">
                📢
              </div>

              <div>

                <h2>
                  Latest Announcements
                </h2>

                <p>
                  Recently published campus updates.
                </p>

              </div>

            </div>


            {latestAnnouncements.length === 0 ? (

              <div className="admin-empty">

                <div className="admin-empty-icon">
                  📭
                </div>

                <h3>
                  No announcements yet
                </h3>

                <p>
                  Create an announcement below.
                </p>

              </div>

            ) : (

              <div className="admin-recent-announcements">

                {latestAnnouncements.map(
                  (announcement) => (

                    <article
                      className="admin-recent-announcement"
                      key={announcement.id}
                    >

                      <div className="admin-recent-announcement-icon">
                        📢
                      </div>

                      <div>

                        <h3>
                          {announcement.title}
                        </h3>

                        <span>
                          📅{' '}
                          {formatAnnouncementDate(
                            announcement.date
                          )}
                        </span>

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

        </div>


        {/* =================================
            QUICK ACTIONS
        ================================= */}

        <section className="admin-quick-actions">

          <h2>
            Quick Actions
          </h2>

          <div className="admin-quick-grid">

            <button
              onClick={() =>
                document
                  .getElementById(
                    'room-management'
                  )
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >

              <span>🏫</span>

              <strong>
                Manage Rooms
              </strong>

              <small>
                Add campus rooms
              </small>

            </button>


            <button
              onClick={() =>
                document
                  .getElementById(
                    'booking-management'
                  )
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >

              <span>📅</span>

              <strong>
                Manage Bookings
              </strong>

              <small>
                Review room reservations
              </small>

            </button>


            <button
              onClick={() =>
                document
                  .getElementById(
                    'create-announcement'
                  )
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >

              <span>📢</span>

              <strong>
                Create Announcement
              </strong>

              <small>
                Share an important update
              </small>

            </button>


            <button
              onClick={() =>
                document
                  .getElementById(
                    'service-requests'
                  )
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >

              <span>📋</span>

              <strong>
                Manage Requests
              </strong>

              <small>
                Review student requests
              </small>

            </button>

          </div>

        </section>


        {/* =================================
            ROOM MANAGEMENT
        ================================= */}

        <section
          className="admin-announcement-section"
          id="room-management"
        >

          <div className="admin-section-heading">

            <div className="admin-section-icon blue-icon">
              🏫
            </div>

            <div>

              <h2>
                Room Management
              </h2>

              <p>
                Add campus rooms that students can book.
              </p>

            </div>

          </div>


          <form
            className="admin-announcement-form"
            onSubmit={createRoom}
          >

            <div className="admin-announcement-field">

              <label>
                Room Number
              </label>

              <input
                type="text"
                value={roomNumber}
                onChange={(event) =>
                  setRoomNumber(
                    event.target.value
                  )
                }
                placeholder="Example: A-101"
                required
              />

            </div>


            <div className="admin-announcement-field">

              <label>
                Building
              </label>

              <input
                type="text"
                value={building}
                onChange={(event) =>
                  setBuilding(
                    event.target.value
                  )
                }
                placeholder="Example: Block A"
                required
              />

            </div>


            <div className="admin-announcement-field">

              <label>
                Capacity
              </label>

              <input
                type="number"
                min="1"
                value={capacity}
                onChange={(event) =>
                  setCapacity(
                    event.target.value
                  )
                }
                placeholder="Example: 60"
                required
              />

            </div>


            <div className="admin-announcement-field">

              <label>
                Room Type
              </label>

              <select
                value={roomType}
                onChange={(event) =>
                  setRoomType(
                    event.target.value
                  )
                }
                required
              >

                <option value="">
                  Select room type
                </option>

                <option value="Classroom">
                  Classroom
                </option>

                <option value="Computer Lab">
                  Computer Lab
                </option>

                <option value="Laboratory">
                  Laboratory
                </option>

                <option value="Seminar Hall">
                  Seminar Hall
                </option>

                <option value="Meeting Room">
                  Meeting Room
                </option>

              </select>

            </div>


            <div className="admin-announcement-form-footer">

              <p>
                💡 These rooms will appear in the student booking page.
              </p>

              <button
                type="submit"
                className="admin-announcement-button"
                disabled={roomLoading}
              >
                {roomLoading
                  ? 'Creating...'
                  : '🏫  Add Room'}
              </button>

            </div>

          </form>


          {/* ROOM LIST */}

          {rooms.length > 0 && (

            <div className="admin-announcement-list">

              {rooms.map((room) => (

                <article
                  className="admin-announcement-card"
                  key={room.id}
                >

                  <div className="admin-announcement-card-icon">
                    🏫
                  </div>

                  <div className="admin-announcement-card-content">

                    <div className="admin-announcement-card-top">

                      <div>

                        <h3>
                          {room.roomNumber}
                        </h3>

                        <span className="admin-announcement-date">
                          🏢 {room.building}
                        </span>

                      </div>

                      <span className="admin-announcement-badge">
                        {room.roomType}
                      </span>

                    </div>

                    <p>
                      👥 Capacity: {room.capacity} students
                    </p>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>


        {/* =================================
            BOOKING MANAGEMENT
        ================================= */}

        <section
          className="admin-requests-section"
          id="booking-management"
        >

          <div className="admin-section-heading">

            <div className="admin-section-icon green-icon">
              📅
            </div>

            <div>

              <h2>
                Room Bookings
              </h2>

              <p>
                Review and manage student room reservations.
              </p>

            </div>

          </div>


          {/* BOOKING SUMMARY */}

          <div className="admin-request-summary">

            <div>
              <span>Total</span>

              <strong>
                {bookings.length}
              </strong>
            </div>


            <div>
              <span>Confirmed</span>

              <strong>
                {confirmedBookings}
              </strong>
            </div>


            <div>
              <span>Cancelled</span>

              <strong>
                {cancelledBookings}
              </strong>
            </div>


            <div>
              <span>Rooms</span>

              <strong>
                {rooms.length}
              </strong>
            </div>

          </div>


          {/* BOOKING LIST */}

          <div className="admin-request-list">

            {bookingLoading ? (

              <div className="admin-empty">

                <div className="admin-loading">
                  Loading bookings...
                </div>

              </div>

            ) : bookings.length === 0 ? (

              <div className="admin-empty">

                <div className="admin-empty-icon">
                  📅
                </div>

                <h3>
                  No bookings yet
                </h3>

                <p>
                  Student room reservations will appear here.
                </p>

              </div>

            ) : (

              bookings.map((booking) => (

                <article
                  className="admin-request-card"
                  key={booking.id}
                >

                  <div className="admin-request-icon">
                    🏫
                  </div>


                  <div className="admin-request-content">

                    <div className="admin-request-top">

                      <div>

                        <h3>
                          Room {booking.roomNumber}
                        </h3>

                        <span className="admin-request-service">
                          📅 {formatBookingDate(booking.date)}
                        </span>

                      </div>


                      <span
                        className={getStatusClass(
                          booking.status
                        )}
                      >
                        {booking.status}
                      </span>

                    </div>


                    <div className="admin-request-details">

                      <div className="admin-student-info">

                        <span className="admin-detail-label">
                          Student
                        </span>

                        <strong>
                          {booking.studentEmail}
                        </strong>

                      </div>


                      <div className="admin-description">

                        <span className="admin-detail-label">
                          Time
                        </span>

                        <p>
                          🕐 {booking.startTime}
                          {' '}–{' '}
                          {booking.endTime}
                        </p>

                      </div>

                    </div>


                    <div className="admin-status-area">

                      <span className="admin-detail-label">
                        Booking Actions
                      </span>


                      <div className="admin-status-actions">

                        <button
                          className={
                            booking.status === 'Confirmed'
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              'Confirmed'
                            )
                          }
                        >
                          ✅ Confirm
                        </button>


                        <button
                          className={
                            booking.status === 'Cancelled'
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            updateBookingStatus(
                              booking.id,
                              'Cancelled'
                            )
                          }
                        >
                          ❌ Cancel
                        </button>

                      </div>

                    </div>

                  </div>

                </article>

              ))

            )}

          </div>

        </section>


        {/* =================================
            CREATE ANNOUNCEMENT
        ================================= */}

        <section
          className="admin-announcement-section"
          id="create-announcement"
        >

          <div className="admin-section-heading">

            <div className="admin-section-icon">
              📢
            </div>

            <div>

              <h2>
                Create Announcement
              </h2>

              <p>
                Share important updates with students.
              </p>

            </div>

          </div>


          <form
            className="admin-announcement-form"
            onSubmit={createAnnouncement}
          >

            <div className="admin-announcement-field">

              <label>
                Announcement Title
              </label>

              <input
                type="text"
                value={announcementTitle}
                onChange={(event) =>
                  setAnnouncementTitle(
                    event.target.value
                  )
                }
                placeholder="Example: Mid-Term Examination Schedule"
                maxLength={100}
                required
              />

              <span className="admin-character-count">
                {announcementTitle.length}/100
              </span>

            </div>


            <div className="admin-announcement-field">

              <label>
                Message
              </label>

              <textarea
                value={announcementMessage}
                onChange={(event) =>
                  setAnnouncementMessage(
                    event.target.value
                  )
                }
                placeholder="Write your announcement here..."
                rows="5"
                maxLength={500}
                required
              />

              <span className="admin-character-count">
                {announcementMessage.length}/500
              </span>

            </div>


            <div className="admin-announcement-field">

              <label>
                Announcement Date
              </label>

              <input
                type="date"
                value={announcementDate}
                onChange={(event) =>
                  setAnnouncementDate(
                    event.target.value
                  )
                }
                required
              />

            </div>


            <div className="admin-announcement-form-footer">

              <p>
                💡 This announcement will be visible
                to authenticated students.
              </p>

              <button
                type="submit"
                className="admin-announcement-button"
                disabled={announcementLoading}
              >
                {announcementLoading
                  ? 'Publishing...'
                  : '📢  Publish Announcement'}
              </button>

            </div>

          </form>

        </section>


        {/* =================================
            PUBLISHED ANNOUNCEMENTS
        ================================= */}

        <section
          className="admin-published-section"
          id="published-announcements"
        >

          <div className="admin-section-heading">

            <div className="admin-section-icon green-icon">
              📢
            </div>

            <div>

              <h2>
                Published Announcements
              </h2>

              <p>
                Announcements currently available to students.
              </p>

            </div>

          </div>


          {announcements.length === 0 ? (

            <div className="admin-empty">

              <div className="admin-empty-icon">
                📭
              </div>

              <h3>
                No announcements yet
              </h3>

              <p>
                Create your first announcement above.
              </p>

            </div>

          ) : (

            <div className="admin-announcement-list">

              {announcements.map((announcement) => (

                <article
                  className="admin-announcement-card"
                  key={announcement.id}
                >

                  <div className="admin-announcement-card-icon">
                    📢
                  </div>

                  <div className="admin-announcement-card-content">

                    <div className="admin-announcement-card-top">

                      <div>

                        <h3>
                          {announcement.title}
                        </h3>

                        <span className="admin-announcement-date">
                          📅{' '}
                          {formatAnnouncementDate(
                            announcement.date
                          )}
                        </span>

                      </div>

                      <span className="admin-announcement-badge">
                        Published
                      </span>

                    </div>

                    <p>
                      {announcement.message}
                    </p>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>


        {/* =================================
            SERVICE REQUESTS
        ================================= */}

        <section
          className="admin-requests-section"
          id="service-requests"
        >

          <div className="admin-section-heading">

            <div className="admin-section-icon blue-icon">
              📋
            </div>

            <div>

              <h2>
                Service Requests
              </h2>

              <p>
                Review and manage student service requests.
              </p>

            </div>

          </div>


          {/* REQUEST SUMMARY */}

          <div className="admin-request-summary">

            <div>
              <span>All</span>

              <strong>
                {totalRequests}
              </strong>
            </div>


            <div>
              <span>Pending</span>

              <strong>
                {pendingRequests}
              </strong>
            </div>


            <div>
              <span>In Progress</span>

              <strong>
                {inProgressRequests}
              </strong>
            </div>


            <div>
              <span>Resolved</span>

              <strong>
                {resolvedRequests}
              </strong>
            </div>

          </div>


          {/* FILTER */}

          <div className="admin-filter">

            <label>
              Filter Requests
            </label>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value)
              }
            >

              <option value="All">
                All Requests
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Resolved">
                Resolved
              </option>

            </select>

          </div>


          {/* REQUEST LIST */}

          <div className="admin-request-list">

            {loading ? (

              <div className="admin-empty">

                <div className="admin-loading">
                  Loading requests...
                </div>

              </div>

            ) : filteredRequests.length === 0 ? (

              <div className="admin-empty">

                <div className="admin-empty-icon">
                  📭
                </div>

                <h3>
                  No requests found
                </h3>

                <p>
                  There are no service requests matching this filter.
                </p>

              </div>

            ) : (

              filteredRequests.map((request) => (

                <article
                  className="admin-request-card"
                  key={request.id}
                >

                  <div className="admin-request-icon">
                    {getRequestIcon(
                      request.serviceType
                    )}
                  </div>


                  <div className="admin-request-content">

                    <div className="admin-request-top">

                      <div>

                        <h3>
                          {request.title}
                        </h3>

                        <span className="admin-request-service">
                          {request.serviceType}
                        </span>

                      </div>


                      <span
                        className={getStatusClass(
                          request.status
                        )}
                      >
                        {request.status}
                      </span>

                    </div>


                    <div className="admin-request-details">

                      <div className="admin-student-info">

                        <span className="admin-detail-label">
                          Student
                        </span>

                        <strong>
                          {request.studentEmail}
                        </strong>

                      </div>


                      <div className="admin-description">

                        <span className="admin-detail-label">
                          Description
                        </span>

                        <p>
                          {request.description}
                        </p>

                      </div>

                    </div>


                    <div className="admin-status-area">

                      <span className="admin-detail-label">
                        Update Status
                      </span>


                      <div className="admin-status-actions">

                        <button
                          className={
                            request.status === 'Pending'
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            updateStatus(
                              request.id,
                              'Pending'
                            )
                          }
                        >
                          ⏳ Pending
                        </button>


                        <button
                          className={
                            request.status === 'In Progress'
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            updateStatus(
                              request.id,
                              'In Progress'
                            )
                          }
                        >
                          🔄 In Progress
                        </button>


                        <button
                          className={
                            request.status === 'Resolved'
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            updateStatus(
                              request.id,
                              'Resolved'
                            )
                          }
                        >
                          ✅ Resolved
                        </button>

                      </div>

                    </div>

                  </div>

                </article>

              ))

            )}

          </div>

        </section>

      </main>

    </div>
  )
}

export default AdminDashboard