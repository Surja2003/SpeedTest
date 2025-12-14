import axios from 'axios';

export interface UserInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  org: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface ConnectionInfo {
  effectiveType: string; // '4g', '3g', '2g', 'slow-2g'
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

// Get user's IP and ISP information
export async function getUserInfo(): Promise<UserInfo | null> {
  // Use HTTPS-only providers to avoid mixed-content blocks under TLS
  // 1) Try ipwho.is (free, HTTPS, CORS enabled)
  // 2) Fallback to ipapi.co (free, HTTPS)
  try {
    const res = await axios.get('https://ipwho.is/', { timeout: 3000 });
    if (res.data && (res.data.success === true || typeof res.data.ip === 'string')) {
      return {
        ip: res.data.ip,
        city: res.data.city || 'Unknown',
        region: res.data.region || res.data.region_name || 'Unknown',
        country: res.data.country || 'Unknown',
        isp: res.data.connection?.isp || res.data.isp || 'Unknown ISP',
        org: res.data.connection?.org || res.data.org || 'Unknown Org',
        lat: typeof res.data.latitude === 'number' ? res.data.latitude : (res.data.lat || 0),
        lon: typeof res.data.longitude === 'number' ? res.data.longitude : (res.data.lon || 0),
        timezone: res.data.timezone?.id || res.data.timezone || 'UTC'
      };
    }
  } catch (e) {
    // continue to fallback
  }

  try {
    const res2 = await axios.get('https://ipapi.co/json/', { timeout: 3000 });
    if (res2.data && res2.data.ip) {
      return {
        ip: res2.data.ip,
        city: res2.data.city || 'Unknown',
        region: res2.data.region || 'Unknown',
        country: res2.data.country_name || res2.data.country || 'Unknown',
        isp: res2.data.org || res2.data.asn || 'Unknown ISP',
        org: res2.data.org || 'Unknown Org',
        lat: res2.data.latitude || res2.data.lat || 0,
        lon: res2.data.longitude || res2.data.lon || 0,
        timezone: res2.data.timezone || 'UTC'
      };
    }
  } catch (e) {
    console.error('Failed to get user info:', e);
  }

  return null;
}

// Get user's location using browser Geolocation API
export async function getUserLocation(): Promise<{ lat: number; lon: number; city?: string } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
          // Reverse geocoding to get city name
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          
          resolve({
            lat,
            lon,
            city: response.data.address?.city || response.data.address?.town || response.data.address?.village
          });
        } catch (error) {
          resolve({ lat, lon });
        }
      },
      (error) => {
        console.log('Location permission denied or error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      }
    );
  });
}

// Get connection information from browser
export function getConnectionInfo(): ConnectionInfo | null {
  // @ts-ignore - navigator.connection is not in all TypeScript definitions
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }
  
  return null;
}

// Calculate distance between two coordinates (for finding nearest server)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Find nearest server based on user location
export function findNearestServer(userLat: number, userLon: number) {
  // Common server locations (you can expand this)
  const servers = [
    { name: 'Mumbai, India', city: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi, India', city: 'Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Bangalore, India', city: 'Bangalore', lat: 12.9716, lon: 77.5946 },
    { name: 'Singapore', city: 'Singapore', lat: 1.3521, lon: 103.8198 },
    { name: 'London, UK', city: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'New York, USA', city: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Frankfurt, Germany', city: 'Frankfurt', lat: 50.1109, lon: 8.6821 },
    { name: 'Tokyo, Japan', city: 'Tokyo', lat: 35.6762, lon: 139.6503 }
  ];

  let nearest = servers[0];
  let minDistance = calculateDistance(userLat, userLon, servers[0].lat, servers[0].lon);

  servers.forEach(server => {
    const distance = calculateDistance(userLat, userLon, server.lat, server.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = server;
    }
  });

  return { ...nearest, distance: Math.round(minDistance) };
}
