import { ImageResponse } from 'next/og';
import { customProfiles } from '../../../data/customProfiles';

export const runtime = 'edge';
export const alt = 'User Profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const DEFAULT_PFP = "https://yt3.googleusercontent.com/kyRX8fESnlAo8xoThhWanH8geyT_U6JIOgTAOU8D1PfzMXl_BW95y06R_sGNKosi_E2arwN9=s160-c-k-c0x00ffffff-no-rj";

export default async function Image({ params }) {
    const { id } = params;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    let logoData = null;
    let pfpData = null;
    let accountData = null;
    let charts = [];

    // Fetch logo
    try {
        const logoUrl = new URL('../../../../public/636a8f1e76b38cb1b9eb0a3d88d7df6f.png', import.meta.url);
        const logoRes = await fetch(logoUrl);
        if (logoRes.ok) logoData = await logoRes.arrayBuffer();
    } catch (e) {
        console.error("OG Logo fetch failed", e);
    }

    // Fetch account data
    try {
        const res = await fetch(`${apiUrl}/api/accounts/${id}`);
        if (res.ok) {
            const json = await res.json();
            accountData = json.account;
            charts = json.charts || [];
        }
    } catch (e) { }

    // Custom Profile Logic
    // Use NEXT_PUBLIC_APP_URL for local public assets
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    const customProfile = accountData ? (customProfiles[accountData.id] || customProfiles[accountData.sonolus_id] || customProfiles[id]) : null;

    // Resolve PFP URL
    const pfpUrl = customProfile?.pfp ?
        (customProfile.pfp.startsWith('http') ? customProfile.pfp : `${appUrl}${customProfile.pfp}`)
        : DEFAULT_PFP;

    // Resolve Banner URL
    let bannerUrl = null;
    if (customProfile?.banner) {
        bannerUrl = customProfile.banner.startsWith('http') ? customProfile.banner : `${appUrl}${customProfile.banner}`;
    }

    // Calculate stats
    const totalCharts = charts.length;
    const totalLikes = charts.reduce((sum, c) => sum + (c.likes || c.like_count || 0), 0);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0f172a',
                    // Removed padding here so absolute background can cover full edge-to-edge
                    position: 'relative',
                }}
            >
                {/* Background (Banner or Gradient) */}
                {bannerUrl ? (
                    <img
                        src={bannerUrl}
                        width={1200}
                        height={630}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            opacity: 0.6,
                            filter: 'blur(10px)',
                        }}
                    />
                ) : (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(circle at 20% 40%, rgba(56, 189, 248, 0.1) 0%, transparent 50%)',
                        }}
                    />
                )}

                {/* Overlay for contrast if banner is used */}
                {bannerUrl && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.7)'
                    }} />
                )}

                {/* Content Container with Padding */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    padding: '60px',
                    position: 'relative',
                }}>
                    {/* Logo */}
                    {logoData && (
                        <div style={{ position: 'absolute', top: 40, right: 50, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img
                                src={`data:image/png;base64,${Buffer.from(logoData).toString('base64')}`}
                                width={40}
                                height={40}
                                style={{ borderRadius: 8 }}
                            />
                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: 600 }}>
                                UntitledCharts
                            </span>
                        </div>
                    )}

                    {/* Main content */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 40, flex: 1, position: 'relative' }}>
                        {/* PFP */}
                        <div
                            style={{
                                width: 200,
                                height: 200,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '4px solid rgba(255,255,255,0.15)',
                                flexShrink: 0,
                                display: 'flex',
                            }}
                        >
                            {pfpUrl ? (
                                <img src={pfpUrl} width={200} height={200} style={{ objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: 200, height: 200, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 80, color: 'rgba(255,255,255,0.3)' }}>?</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <span style={{ fontSize: 52, fontWeight: 700, color: 'white' }}>
                                    {accountData?.sonolus_username || 'Unknown User'}
                                </span>
                                {accountData?.admin && (
                                    <span style={{ padding: '6px 14px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: 16, fontWeight: 700, borderRadius: 8 }}>
                                        ADMIN
                                    </span>
                                )}
                                {accountData?.mod && !accountData?.admin && (
                                    <span style={{ padding: '6px 14px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', fontSize: 16, fontWeight: 700, borderRadius: 8 }}>
                                        MOD
                                    </span>
                                )}
                            </div>

                            <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                                #{accountData?.sonolus_handle || '000000'}
                            </span>

                            {/* Stats */}
                            <div style={{ display: 'flex', gap: 40, marginTop: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>{totalCharts}</span>
                                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>Charts</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>{formatNumber(totalLikes)}</span>
                                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>Total Likes</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 18, position: 'relative' }}>
                        untitledcharts.com/user/{id?.substring(0, 12)}...
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
