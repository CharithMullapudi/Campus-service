import { useEffect, useState } from 'react'
import { client } from '../client'
import { getCurrentUser } from 'aws-amplify/auth'

function StudentDashboard({ user, signOut }) {
  const [requests, setRequests] = useState([])
  const [announcements, setAnnouncements] = useState([])

  const [activePage, setActivePage] = useState('dashboard')

  const [serviceType, setServiceType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [announcementLoading, setAnnouncementLoading] = useState(true)

  // =========================================
  // LOAD SERVICE REQUESTS
  // =========================================

  async function loadRequests() {
    try {
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
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    loadRequests()
    loadAnnouncements()
  }, [])

  // =========================================
  // CREATE REQUEST
  // =========================================

  async function createRequest(event) {
    event.preventDefault()

    if (!serviceType || !title || !description) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)

    try {
      const currentUser = await getCurrentUser()

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

      alert('Service request submitted successfully!')

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
  // STATUS CLASS
  // =========================================

  function getStatusClass(status) {
    if (status === 'Resolved') {
      return 'student-status resolved'
    }

    if (status === 'In Progress') {
      return 'student-status progress'
    }

    return 'student-status pending'
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
  // NAVIGATION
  // =========================================

  function openPage(page) {
    setActivePage(page)
  }

  // =========================================
  // DASHBOARD STATISTICS
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

  const recentRequests = [...requests]
    .reverse()
    .slice(0, 3)

  const latestAnnouncements =
    announcements.slice(0, 3)

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
              DASHBOARD PAGE
          ================================= */}

          {activePage === 'dashboard' && (

            <>

              {/* WELCOME */}

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


              {/* STATISTICS */}

              <section className="student-statistics">

                <div className="student-stat-card">

                  <div className="student-stat-icon blue">
                    📋
                  </div>

                  <div>
                    <span>Total Requests</span>
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
                    <span>Pending</span>
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
                    <span>In Progress</span>
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
                    <span>Resolved</span>
                    <strong>
                      {resolvedRequests}
                    </strong>
                  </div>

                </div>

              </section>


              {/* RECENT REQUESTS + ANNOUNCEMENTS */}

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

                      {recentRequests.map((request) => (

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

                      ))}

                    </div>

                  )}


                  {requests.length > 3 && (

                    <button
                      className="student-view-all"
                      onClick={() =>
                        openPage('requests')
                      }
                    >
                      View All Requests →
                    </button>

                  )}

                </section>


                {/* LATEST ANNOUNCEMENTS */}

                <section className="student-card">

                  <div className="student-card-heading">

                    <div className="card-icon announcement-icon">
                      📢
                    </div>

                    <div>

                      <h2>
                        Latest Announcements
                      </h2>

                      <p>
                        Important campus updates.
                      </p>

                    </div>

                  </div>


                  {announcementLoading ? (

                    <div className="student-empty">

                      <h3>
                        Loading...
                      </h3>

                    </div>

                  ) : latestAnnouncements.length === 0 ? (

                    <div className="student-empty">

                      <div className="announcement-empty-icon">
                        📭
                      </div>

                      <h3>
                        No announcements
                      </h3>

                      <p>
                        There are no announcements yet.
                      </p>

                    </div>

                  ) : (

                    <div className="student-dashboard-announcements">

                      {latestAnnouncements.map(
                        (announcement) => (

                          <article
                            className="student-dashboard-announcement"
                            key={announcement.id}
                          >

                            <div className="dashboard-announcement-icon">
                              📢
                            </div>

                            <div>

                              <h3>
                                {announcement.title}
                              </h3>

                              <span>
                                📅 {announcement.date}
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


                  {announcements.length > 3 && (

                    <button
                      className="student-view-all"
                      onClick={() =>
                        openPage('announcements')
                      }
                    >
                      View All Announcements →
                    </button>

                  )}

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
                      openPage('requests')
                    }
                  >
                    <span>📋</span>

                    <strong>
                      Track My Requests
                    </strong>

                    <small>
                      Check your request status
                    </small>

                  </button>


                  <button
                    onClick={() =>
                      openPage('announcements')
                    }
                  >
                    <span>📢</span>

                    <strong>
                      View Announcements
                    </strong>

                    <small>
                      Read campus updates
                    </small>

                  </button>

                </div>

              </section>

            </>

          )}


          {/* =================================
              NEW REQUEST PAGE
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
              MY REQUESTS PAGE
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

                  {requests.map((request) => (

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

                  ))}

                </div>

              )}

            </section>

          )}


          {/* =================================
              ANNOUNCEMENTS PAGE
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

                  {announcements.map((announcement) => (

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

                  ))}

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