-- Signup fix: broken trigger blocked all registrations (error showed as "{}")
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Profiles are created by /api/auth/register and /api/auth/b2b-register
