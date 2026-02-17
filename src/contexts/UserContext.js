"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const UserContext = createContext();

const APILink = process.env.NEXT_PUBLIC_API_URL;

export function UserProvider({ children }) {
  const router = useRouter(); // Added router
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sonolusUser, setSonolusUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assetBaseUrl, setAssetBaseUrl] = useState('');
  const [session, setSession] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const clearExpiredSession = (shouldRedirect = true, errorMessage = null) => {
    localStorage.removeItem("session");
    localStorage.removeItem("expiry");
    setIsLoggedIn(false);
    setSonolusUser(null);
    setSession(null);
    setSessionReady(true);
    window.dispatchEvent(new CustomEvent('authChange'));

    if (shouldRedirect) {
      const params = new URLSearchParams();
      params.set('reason', 'expired');
      if (errorMessage) {
        params.set('details', errorMessage);
      }
      router.push(`/login?${params.toString()}`);
    }
  };

  const checkAuthStatus = async () => {
    if (!isClient) return;

    setLoading(true);
    const sessionValue = localStorage.getItem("session");
    const expiry = localStorage.getItem("expiry");

    let expiryTime = parseInt(expiry, 10);

    // Heuristic to detect if expiry is in seconds (Unix timestamp) or milliseconds
    // 100000000000 is ~ year 1973 in ms, or year 5138 in seconds.
    // So if it's less than this, it's almost certainly seconds.
    if (expiryTime < 100000000000) {
      expiryTime *= 1000;
    }

    if (isNaN(expiryTime) || expiryTime < Date.now()) {
      clearExpiredSession(false); // Don't redirect immediately on load, let components handle it or just show logged out state? 
      // Actually, if I'm on a protected page, the page redirects. If I'm on public page, I shouldn't be redirected.
      // So false is correct here.
      setLoading(false);
      return;
    }

    if (sessionValue) {
      setIsLoggedIn(true);
      setSession(sessionValue);

      try {
        const me = await fetch(`${APILink}/api/accounts/session/account/`, {
          headers: {
            "Authorization": `${sessionValue}`
          }
        });

        if (!me.ok) {
          if (me.status === 401) {
            let errorMsg = "Unauthorized";
            try {
              const errData = await me.json();
              errorMsg = errData.message || errData.detail || JSON.stringify(errData);
            } catch (e) {
              errorMsg = await me.text().catch(() => "Unauthorized");
            }
            clearExpiredSession(true, errorMsg); // Redirect on 401 with error
            setLoading(false);
            return;
          }
        } else {
          const meData = await me.json();

          // Normalize admin/mod fields so both naming conventions are available
          const normalizeRoles = (user) => ({
            ...user,
            isAdmin: !!(user.isAdmin || user.admin),
            isMod: !!(user.isMod || user.mod),
            admin: !!(user.isAdmin || user.admin),
            mod: !!(user.isMod || user.mod),
          });

          setSonolusUser(normalizeRoles(meData));

          // Fetch full account data (banner_hash, profile_hash, asset_base_url)
          if (meData.sonolus_id) {
            try {
              const profileRes = await fetch(`${APILink}/api/accounts/${meData.sonolus_id}`);
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                setAssetBaseUrl(profileData.asset_base_url || '');
                if (profileData.account) {
                  setSonolusUser(prev => normalizeRoles({ ...prev, ...profileData.account }));
                }
              }
            } catch (e) {
              // Full profile fetch failed, banner/pfp won't show in header
            }
          }
        }

      } catch (error) {
      }
    } else {
      setIsLoggedIn(false);
      setSonolusUser(null);
      setSession(null);
    }

    setLoading(false);
    setSessionReady(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("session");
    localStorage.removeItem("expiry");
    setIsLoggedIn(false);
    setSonolusUser(null);
    setSession(null);
    setSessionReady(true);
    window.dispatchEvent(new CustomEvent('authChange'));
    router.push('/login');
  };

  const refreshUser = () => {
    checkAuthStatus();
  };

  const isSessionValid = () => {
    if (!isClient) return false;

    const sessionValue = localStorage.getItem("session");
    const expiry = localStorage.getItem("expiry");

    if (!sessionValue || !expiry) {
      return false;
    }

    return !!sessionValue;
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    checkAuthStatus();

    window.addEventListener('storage', checkAuthStatus);

    const handleAuthChange = () => checkAuthStatus();
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [isClient, isLoggedIn]);

  const value = {
    isLoggedIn,
    sonolusUser,
    assetBaseUrl,
    loading,
    session,
    isClient,
    sessionReady,
    handleLogout,
    refreshUser,
    isSessionValid,
    clearExpiredSession
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
