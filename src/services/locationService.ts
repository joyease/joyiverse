/**
 * GPS 定位輔助工具
 * 針對 Web 瀏覽器環境、iframe 環境與高低精度 fallback 進行全方位容錯優化
 */

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy: number;
  source: 'gps-high-accuracy' | 'gps-standard' | 'ip-fallback' | 'manual';
  message: string;
}

/**
 * 取得精準 GPS 經緯度（自動進行高精度 -> 標準精度 -> IP 概略位置三段式容錯）
 */
export async function getAccurateLocation(): Promise<LocationResult> {
  // 檢查瀏覽器是否支援 Geolocation API
  if (!navigator || !navigator.geolocation) {
    return fallbackIpLocation('瀏覽器未支援或限制存取 Geolocation API');
  }

  // 嘗試取得 Permissions API 狀態 (若支援)
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (permissionStatus.state === 'denied') {
        return fallbackIpLocation('瀏覽器已被設定為「拒絕存取位置」，請至瀏覽器網址列左側允許定位權限');
      }
    }
  } catch (e) {
    // 某些瀏覽器不支援 query geolocation，忽略並繼續
  }

  // 階段 1：嘗試高精度 GPS (High Accuracy)
  try {
    const highAccPos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 10000,
      });
    });

    const lat = Number(highAccPos.coords.latitude.toFixed(5));
    const lng = Number(highAccPos.coords.longitude.toFixed(5));
    const accuracy = Math.round(highAccPos.coords.accuracy || 20);

    return {
      lat,
      lng,
      accuracy,
      source: 'gps-high-accuracy',
      message: `高精度 GPS 定位成功（精準度 ±${accuracy}m）`,
    };
  } catch (highErr: any) {
    console.warn('[GPS] 高精度定位逾時或失敗，嘗試標準定位模式:', highErr.message);
  }

  // 階段 2：嘗試標準精度 (WiFi / 基地台快速定位)
  try {
    const standardPos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000,
      });
    });

    const lat = Number(standardPos.coords.latitude.toFixed(5));
    const lng = Number(standardPos.coords.longitude.toFixed(5));
    const accuracy = Math.round(standardPos.coords.accuracy || 100);

    return {
      lat,
      lng,
      accuracy,
      source: 'gps-standard',
      message: `基地台/網路定位成功（精準度 ±${accuracy}m）`,
    };
  } catch (stdErr: any) {
    console.warn('[GPS] 標準定位失敗，嘗試 IP 網路概略位置:', stdErr.message);
  }

  // 階段 3：若 GPS 權限被拒或超時，使用免費公開 IP-API 取得概略城市座標（避免定位卡死或無反映）
  return fallbackIpLocation('GPS 連線逾時或未獲權限');
}

/**
 * IP 網路概略位置 Fallback
 */
async function fallbackIpLocation(reason: string): Promise<LocationResult> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          lat: Number(data.latitude.toFixed(5)),
          lng: Number(data.longitude.toFixed(5)),
          accuracy: 5000,
          source: 'ip-fallback',
          message: `已自動由網路服務定位於 ${data.city || data.region || '台灣'}（可點擊地圖調整精確點）`,
        };
      }
    }
  } catch (e) {
    // ignore
  }

  // 預設台北中心
  return {
    lat: 25.0330,
    lng: 121.5654,
    accuracy: 10000,
    source: 'manual',
    message: `${reason}，已設為預設位置（您可直接點擊地圖選擇打卡點）`,
  };
}
