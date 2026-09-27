import { useEffect, useState } from 'react'
import { Authenticator } from '@aws-amplify/ui-react'
import { fetchAuthSession } from 'aws-amplify/auth'

import StudentDashboard from './pages/StudentDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <Authenticator
      className="campus-auth"
      components={{
        Header() {
          return (
            <div className="login-brand">

              <div className="login-logo">
                🏫
              </div>

              <h1>
                Campus Service
              </h1>

              <p>
                One platform for all campus services
              </p>

            </div>
          )
        },

        Footer() {
          return (
            <div className="login-footer">
              <span>
                Campus Service Portal
              </span>
            </div>
          )
        },
      }}
    >
      {({ signOut, user }) => (
        <AuthenticatedApp
          user={user}
          signOut={signOut}
        />
      )}
    </Authenticator>
  )
}

function AuthenticatedApp({ user, signOut }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)

  useEffect(() => {
    async function checkUserRole() {
      try {
        const session = await fetchAuthSession()

        const groups =
          session.tokens?.idToken?.payload?.[
            'cognito:groups'
          ] || []

        console.log('User groups:', groups)

        setIsAdmin(
          groups.includes('ADMINS')
        )
      } catch (error) {
        console.error(
          'Unable to check user role:',
          error
        )

        setIsAdmin(false)
      } finally {
        setCheckingRole(false)
      }
    }

    checkUserRole()
  }, [])

  if (checkingRole) {
    return (
      <div className="role-loading">
        <div className="role-loading-icon">
          🏫
        </div>

        <h2>
          Loading Campus Service...
        </h2>

        <p>
          Checking your account...
        </p>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <AdminDashboard
        user={user}
        signOut={signOut}
      />
    )
  }

  return (
    <StudentDashboard
      user={user}
      signOut={signOut}
    />
  )
}

export default App